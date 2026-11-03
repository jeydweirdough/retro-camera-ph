import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  // Migrations use the direct (non-pooled) connection.
  dbCredentials: { url: process.env.DATABASE_URL! },
  // Neon Auth owns its own schema; never touch it.
  schemaFilter: ["public"],
});
