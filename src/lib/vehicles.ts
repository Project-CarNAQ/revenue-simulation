import { getDb, schema } from "@/db";
import { eq, desc } from "drizzle-orm";
import { VehicleCategory } from "./types";
import { VehicleContext } from "./simulation";
import { randomUUID } from "crypto";

// Global in-memory store for local testing without database connection across Next.js bundles
const globalForVehicles = globalThis as unknown as {
  __carnaq_vehicles?: Map<string, typeof schema.vehicleProfiles.$inferSelect>;
};

const inMemoryVehicles =
  globalForVehicles.__carnaq_vehicles ??
  new Map<string, typeof schema.vehicleProfiles.$inferSelect>();

if (!globalForVehicles.__carnaq_vehicles) {
  globalForVehicles.__carnaq_vehicles = inMemoryVehicles;
}

function isDbConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(url && !url.includes("sample") && !url.includes("placeholder"));
}

export async function createVehicleProfile(
  category: VehicleCategory,
  city: string,
  registeredDate: string
) {
  if (isDbConfigured()) {
    try {
      const db = getDb();
      const [vehicle] = await db
        .insert(schema.vehicleProfiles)
        .values({
          category,
          city,
          registered_date: registeredDate,
        })
        .returning();
      return vehicle;
    } catch (err) {
      console.warn("DB insert failed, storing in memory for local session:", err);
    }
  }

  const id = randomUUID();
  const vehicle = {
    id,
    category,
    city,
    registered_date: registeredDate,
    created_at: new Date(),
  };
  inMemoryVehicles.set(id, vehicle);
  return vehicle;
}

export async function listVehicleProfiles(categoryFilter?: string, cityFilter?: string) {
  let vehicles: Array<typeof schema.vehicleProfiles.$inferSelect> = [];

  if (isDbConfigured()) {
    try {
      const db = getDb();
      vehicles = await db
        .select()
        .from(schema.vehicleProfiles)
        .orderBy(desc(schema.vehicleProfiles.created_at));
    } catch (err) {
      console.warn("DB query failed, reading from in-memory store:", err);
      vehicles = Array.from(inMemoryVehicles.values());
    }
  } else {
    vehicles = Array.from(inMemoryVehicles.values());
  }

  if (categoryFilter) {
    vehicles = vehicles.filter((v) => v.category === categoryFilter);
  }
  if (cityFilter) {
    vehicles = vehicles.filter(
      (v) => v.city.toLowerCase() === cityFilter.toLowerCase()
    );
  }

  return vehicles;
}

export async function seedDemoVehicles() {
  const demoList: Array<{
    category: VehicleCategory;
    city: string;
    registered_date: string;
  }> = [
    { category: "sedan", city: "Lahore", registered_date: "2025-01-10" },
    { category: "suv", city: "Lahore", registered_date: "2025-01-20" },
    { category: "hatchback", city: "Karachi", registered_date: "2025-02-01" },
    { category: "sedan", city: "Karachi", registered_date: "2025-02-15" },
    { category: "suv", city: "Islamabad", registered_date: "2025-03-01" },
    { category: "hatchback", city: "Islamabad", registered_date: "2025-03-15" },
  ];

  const createdVehicles = [];
  for (const item of demoList) {
    const v = await createVehicleProfile(item.category, item.city, item.registered_date);
    createdVehicles.push(v);
  }

  return createdVehicles;
}

export async function getVehicleProfileById(rawId: string) {
  // Strip common URL path mistakes like ':id=' or 'id='
  const cleanedId = rawId.replace(/^:?id=/, "").trim();

  if (isDbConfigured()) {
    try {
      const db = getDb();
      const [vehicle] = await db
        .select()
        .from(schema.vehicleProfiles)
        .where(eq(schema.vehicleProfiles.id, cleanedId))
        .limit(1);

      if (vehicle) return vehicle;
    } catch (err) {
      console.warn("DB query failed, checking in-memory storage:", err);
    }
  }

  // Check exact in-memory match
  const exact = inMemoryVehicles.get(cleanedId);
  if (exact) return exact;

  // Prefix match fallback (e.g. if user passes short 8-character UUID snippet)
  if (cleanedId.length >= 4) {
    for (const [vId, profile] of inMemoryVehicles.entries()) {
      if (vId.toLowerCase().startsWith(cleanedId.toLowerCase())) {
        return profile;
      }
    }
  }

  return null;
}

export async function updateVehicleProfile(
  id: string,
  updates: { category?: VehicleCategory; city?: string }
) {
  if (isDbConfigured()) {
    try {
      const db = getDb();
      const valuesToUpdate: Partial<typeof schema.vehicleProfiles.$inferInsert> = {};

      if (updates.category) valuesToUpdate.category = updates.category;
      if (updates.city) valuesToUpdate.city = updates.city;

      if (Object.keys(valuesToUpdate).length === 0) {
        return await getVehicleProfileById(id);
      }

      const [updated] = await db
        .update(schema.vehicleProfiles)
        .set(valuesToUpdate)
        .where(eq(schema.vehicleProfiles.id, id))
        .returning();

      if (updated) return updated;
    } catch (err) {
      console.warn("DB update failed, updating in-memory storage:", err);
    }
  }

  const existing = inMemoryVehicles.get(id);
  if (!existing) return null;

  const updated = {
    ...existing,
    ...(updates.category && { category: updates.category }),
    ...(updates.city && { city: updates.city }),
  };
  inMemoryVehicles.set(id, updated);
  return updated;
}

export async function deleteVehicleProfile(id: string) {
  if (isDbConfigured()) {
    try {
      const db = getDb();
      await db
        .delete(schema.vehicleProfiles)
        .where(eq(schema.vehicleProfiles.id, id));
    } catch (err) {
      console.warn("DB delete failed, clearing in-memory storage:", err);
    }
  }

  inMemoryVehicles.delete(id);
}

export function toVehicleContext(
  vehicle: typeof schema.vehicleProfiles.$inferSelect
): VehicleContext {
  return {
    id: vehicle.id,
    category: vehicle.category as VehicleCategory,
    city: vehicle.city,
    registered_date: vehicle.registered_date,
  };
}
