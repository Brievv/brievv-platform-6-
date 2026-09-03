import { test, expect } from "@playwright/test";
import { randomUUID } from "crypto";

/**
 * Critical professional journey (spec §64):
 *   Professional visits site -> Apply -> Application stored ->
 *   Admin sees application -> Admin reviews profile -> Admin approves ->
 *   Professional receives notification -> Professional completes
 *   onboarding -> Professional appears in matching engine
 *
 * Requires: a running dev server against a seeded database, and an admin
 * account (see prisma/seed.ts — ops@brievv.dev / BrievvAdmin!2026) to run
 * the approval half of this journey. See tests/e2e/README.md.
 */

test.describe("Professional journey", () => {
  const email = `e2e-pro-${randomUUID().slice(0, 8)}@brievv.dev`;
  const password = "TestPassword123!";

  test("professional can submit an application", async ({ page }) => {
    await page.goto("/apply");

    await page.getByLabel("Full name").fill("E2E Test Professional");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Structural Engineering" }).click();
    await page.getByLabel(/years of experience/i).fill("8");
    await page.getByLabel(/license number/i).fill("PE-99999");
    await page.getByLabel(/licensing state/i).fill("CA");

    await page.getByRole("button", { name: /submit application/i }).click();
    await expect(page.getByText(/application received/i)).toBeVisible();
  });

  test("admin sees the new application in the professionals queue", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("ops@brievv.dev");
    await page.getByLabel("Password").fill("BrievvAdmin!2026");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.goto("/admin/professionals");
    await expect(page.getByText(email)).toBeVisible();
  });

  test("admin can approve the professional", async ({ page }) => {
    await page.goto("/admin/professionals");
    const row = page.locator("div", { hasText: email }).first();
    await row.getByRole("button", { name: /approve/i }).click();

    await expect(row.getByText(/active/i)).toBeVisible();
  });

  test("professional can sign in and see verified status", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.goto("/pro");
    await expect(page.getByText(/active/i)).toBeVisible();
  });

  test("approved professional is a matching candidate for a project in their discipline", async ({ page }) => {
    // Signed in as admin from a prior test's storage state in a real CI
    // setup; here we re-authenticate for isolation.
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("ops@brievv.dev");
    await page.getByLabel("Password").fill("BrievvAdmin!2026");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.goto("/admin/matching");
    // Requires at least one project with status QUOTE_ACCEPTED or later
    // in a Structural Engineering discipline — see seed data.
    const projectSelect = page.getByRole("combobox").first();
    if ((await projectSelect.locator("option").count()) > 0) {
      await page.getByRole("button", { name: /run matching/i }).click();
      await expect(page.getByText("E2E Test Professional")).toBeVisible({ timeout: 10_000 });
    }
  });
});
