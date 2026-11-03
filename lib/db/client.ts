import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let db: NodePgDatabase<typeof schema> | undefined;

/**
 * Database for the app, through Neon's connection pooler (many short-lived
 * serverless functions share a few real connections). Created on first use.
 */
export function getDb() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");
    db = drizzle(new Pool({ connectionString, max: 5 }), { schema });
  }
  return db;
}
