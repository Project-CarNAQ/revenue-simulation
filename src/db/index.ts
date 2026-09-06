import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let sqlClient: NeonQueryFunction<false, false> | null = null;
let dbClient: NeonHttpDatabase<typeof schema> | null = null;

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL environment variable is not set. Please configure it in your environment or .env file."
    );
  }

  if (!dbClient) {
    sqlClient = neon(databaseUrl);
    dbClient = drizzle(sqlClient, { schema });
  }

  return dbClient;
}

export function getRawSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL environment variable is not set. Please configure it in your environment or .env file."
    );
  }

  if (!sqlClient) {
    sqlClient = neon(databaseUrl);
  }

  return sqlClient;
}

export { schema };
