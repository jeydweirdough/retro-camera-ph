import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests that hit the real database (npm run test:db). Works on Windows too,
// unlike a `RUN_DB_TESTS=1 vitest` prefix.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    include: ["**/*.db.test.ts"],
    exclude: ["node_modules", ".next"],
    env: { RUN_DB_TESTS: "1" },
  },
});
