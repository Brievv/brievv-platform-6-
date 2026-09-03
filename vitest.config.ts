import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    globals: false,
    env: {
      // Test-only value so pure-function unit tests (e.g. MFA encryption)
      // that read src/lib/env.ts don't require a full .env.local. Never
      // use this value outside tests.
      AUTH_SECRET: "test-only-secret-do-not-use-in-production-xxxxxxxx",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
