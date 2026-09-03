import { defineConfig, devices } from "@playwright/test";

/**
 * Requires a running dev server (`npm run dev`) against a seeded database
 * (`npm run db:seed`), plus real credentials for Stripe (test mode) and
 * the AI provider — these E2E specs are NOT executable in a sandboxed
 * environment with no live Postgres/network access. See tests/e2e/README.md.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-375", use: { ...devices["iPhone SE"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
      },
});
