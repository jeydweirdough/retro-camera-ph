import { existsSync } from "node:fs";
import { defineCliConfig } from "sanity/cli";

// The Sanity CLI doesn't read Next.js env files on its own.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  },
});
