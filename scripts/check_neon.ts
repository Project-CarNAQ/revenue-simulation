import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { neon } from "@neondatabase/serverless";

async function check() {
  const sql = neon(process.env.DATABASE_URL!);
  const configCount = await sql`SELECT count(*) FROM simulation_config`;
  const vehicleCount = await sql`SELECT count(*) FROM vehicle_profiles`;

  console.log("Neon DB Status:");
  console.log(" - simulation_config rows:", configCount[0].count);
  console.log(" - vehicle_profiles rows:", vehicleCount[0].count);

  if (Number(vehicleCount[0].count) === 0) {
    console.log("Seeding 6 sample vehicles into Neon DB...");
    const demoVehicles = [
      { category: "sedan", city: "Lahore", registered_date: "2025-01-10" },
      { category: "suv", city: "Lahore", registered_date: "2025-01-20" },
      { category: "hatchback", city: "Karachi", registered_date: "2025-02-01" },
      { category: "sedan", city: "Karachi", registered_date: "2025-02-15" },
      { category: "suv", city: "Islamabad", registered_date: "2025-03-01" },
      { category: "hatchback", city: "Islamabad", registered_date: "2025-03-15" },
    ];

    for (const v of demoVehicles) {
      await sql`
        INSERT INTO vehicle_profiles (category, city, registered_date)
        VALUES (${v.category}, ${v.city}, ${v.registered_date});
      `;
    }
    console.log("Successfully seeded 6 vehicles into vehicle_profiles table in Neon!");
  }

  const vehicles = await sql`SELECT id, category, city, registered_date FROM vehicle_profiles LIMIT 6`;
  console.log("Current Neon Fleet:");
  vehicles.forEach((v: any) => console.log(` - ${v.id} (${v.category}, ${v.city})`));
}

check().catch(console.error);
