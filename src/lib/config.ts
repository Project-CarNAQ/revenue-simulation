import { getDb, schema } from "@/db";
import { SimulationConfig } from "./types";
import defaultsData from "../../config/defaults.json";

export const DEFAULT_CONFIG: SimulationConfig = defaultsData as SimulationConfig;

// Global in-memory overrides for local execution without database across Next.js bundles
const globalForConfig = globalThis as unknown as {
  __carnaq_config_overrides?: Map<string, any>;
};

const inMemoryConfigOverrides =
  globalForConfig.__carnaq_config_overrides ?? new Map<string, any>();

if (!globalForConfig.__carnaq_config_overrides) {
  globalForConfig.__carnaq_config_overrides = inMemoryConfigOverrides;
}

function isDbConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(url && !url.includes("sample") && !url.includes("placeholder"));
}

/**
 * Retrieves the active simulation configuration by querying the simulation_config table
 * and falling back to default values from config/defaults.json for any missing keys.
 */
export async function getActiveConfig(): Promise<SimulationConfig> {
  const mergedConfig: Record<string, any> = { ...DEFAULT_CONFIG };

  if (isDbConfigured()) {
    try {
      const db = getDb();
      const rows = await db.select().from(schema.simulationConfig);

      for (const row of rows) {
        if (row.value !== undefined && row.value !== null) {
          mergedConfig[row.key] = row.value;
        }
      }
    } catch (error) {
      console.warn(
        "Warning: Could not fetch simulation_config from database, checking in-memory overrides."
      );
    }
  }

  for (const [key, val] of inMemoryConfigOverrides.entries()) {
    mergedConfig[key] = val;
  }

  return mergedConfig as SimulationConfig;
}

/**
 * Returns raw key-value mapping of all configuration entries.
 */
export async function getAllConfigEntries(): Promise<Record<string, any>> {
  const config = await getActiveConfig();
  return config as unknown as Record<string, any>;
}

/**
 * Updates a configuration key in the simulation_config table.
 */
export async function setConfigValue(
  key: string,
  value: any,
  updatedBy: string
) {
  if (isDbConfigured()) {
    try {
      const db = getDb();
      const [record] = await db
        .insert(schema.simulationConfig)
        .values({
          key,
          value,
          updated_by: updatedBy,
          updated_at: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.simulationConfig.key,
          set: {
            value,
            updated_by: updatedBy,
            updated_at: new Date(),
          },
        })
        .returning();

      if (record) return record;
    } catch (error) {
      console.warn("Database update failed, updating in-memory store:", error);
    }
  }

  inMemoryConfigOverrides.set(key, value);
  return {
    key,
    value,
    updated_by: updatedBy,
    updated_at: new Date(),
  };
}
