import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { neon } from "@neondatabase/serverless";
import * as fs from "fs";
import * as path from "path";

async function runSeed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Error: DATABASE_URL environment variable is not defined.");
    process.exit(1);
  }

  console.log("Connecting to database via Neon serverless client...");
  const sql = neon(databaseUrl);

  console.log("Ensuring vehicle_profiles and simulation_config tables exist...");

  await sql`
    CREATE TABLE IF NOT EXISTS vehicle_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category TEXT NOT NULL CHECK (category IN ('hatchback', 'sedan', 'suv')),
      city TEXT NOT NULL,
      registered_date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS simulation_config (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_by TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  const defaultsPath = path.resolve(process.cwd(), "config/defaults.json");
  if (!fs.existsSync(defaultsPath)) {
    console.error(`Defaults config not found at: ${defaultsPath}`);
    process.exit(1);
  }

  const defaults = JSON.parse(fs.readFileSync(defaultsPath, "utf-8"));
  console.log("Seeding simulation_config from defaults.json (ON CONFLICT DO NOTHING)...");

  let insertedCount = 0;
  for (const [key, val] of Object.entries(defaults)) {
    const res = await sql`
      INSERT INTO simulation_config (key, value, updated_by, updated_at)
      VALUES (${key}, ${JSON.stringify(val)}::jsonb, 'seed:system', now())
      ON CONFLICT (key) DO NOTHING
      RETURNING key;
    `;
    if (res.length > 0) {
      insertedCount++;
    }
  }

  console.log(
    `Seeding complete. Inserted ${insertedCount} new config entries (existing keys preserved).`
  );
}

runSeed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
