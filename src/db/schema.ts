import { pgTable, uuid, text, date, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const vehicleProfiles = pgTable("vehicle_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: text("category").notNull(), // 'hatchback' | 'sedan' | 'suv'
  city: text("city").notNull(),
  registered_date: date("registered_date").notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
});

export const simulationConfig = pgTable("simulation_config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updated_by: text("updated_by").notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
});

export type VehicleProfile = typeof vehicleProfiles.$inferSelect;
export type NewVehicleProfile = typeof vehicleProfiles.$inferInsert;
export type SimulationConfigRow = typeof simulationConfig.$inferSelect;
