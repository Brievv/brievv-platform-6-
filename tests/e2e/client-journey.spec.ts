import { test, expect } from "@playwright/test";
import { randomUUID } from "crypto";

/**
 * Critical client journey (spec §63):
 *   Visitor -> Start Project -> Create account -> Submit brief ->
 *   Upload files -> AI analyzes project -> Quote generated ->
 *   Client reviews quote -> Client accepts quote -> Stripe payment ->
 *   Project created -> Team matched -> Client sees progress ->
 *   Professional uploads deliverable -> QA review -> Client approves ->
 *   Project completed -> Invoice/receipt generated
 *
 * Requires: a running dev server against a seeded/migrated database, a
 * real AI_API_KEY (the brief step calls the live estimator), and Stripe
 * test-mode keys with a configured webhook forwarding to the local
 * server (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
 * for the payment step to actually flip the project to READY_TO_START.
 * See tests/e2e/README.md for full setup.
 */

test.describe("Client journey", () => {
  const email = `e2e-client-${randomUUID().slice(0, 8)}@brievv.dev`;
  const password = "TestPassword123!";

  test("visitor can create an account", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByLabel("Full name").fill("E2E Test Client");
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password").fill(password);
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page).toHaveURL(/sign-in/);
  });

  test("client can sign in and reach onboarding", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/onboarding|dashboard/);
  });

  test("client can submit a project brief and receive a quote", async ({ page }) => {
    await page.goto("/start");

    // Step 1 — Project
    await page.getByLabel("Project name").fill("E2E Test — Two-story ADU permit set");
    await page.getByRole("button", { name: /continue/i }).click();

    // Step 2 — Disciplines (multi-select chip buttons, not a <select>)
    await page.getByRole("button", { name: "Architecture" }).click();
    await page.getByRole("button", { name: /continue/i }).click();

    // Step 3 — Scope
    await page.getByLabel(/describe the work/i).fill("Full permit-ready drawing set for a 600sqft detached ADU, single story, wood frame construction.");
    await page.getByRole("button", { name: /continue/i }).click();

    // Step 4 — Files (skip; upload tested separately since it requires real S3 credentials)
    await page.getByRole("button", { name: /continue/i }).click();

    // Step 5 — Requirements
    await page.getByLabel("Urgency").selectOption({ label: "Standard" });
    await page.getByRole("button", { name: /continue/i }).click();

    // Step 6 — Contact
    await page.getByLabel("Full name").fill("E2E Test Client");
    await page.getByLabel("Work email").fill(email);
    await page.getByRole("button", { name: /get my instant quote/i }).click();

    // Step 7-8 — AI analysis + review happen server-side inline; expect the quote result
    await expect(page.getByText(/reference/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/estimated (price|investment)/i)).toBeVisible();
  });

  test("client can review and approve a quote from the dashboard", async ({ page }) => {
    await page.goto("/dashboard/quotes");
    await page.getByRole("link").first().click();

    await expect(page.getByText(/estimated investment|estimated price/i)).toBeVisible();
    await page.getByRole("button", { name: /approve & start project/i }).click();
    await expect(page.getByText(/approved/i)).toBeVisible();
  });

  test("client can start checkout for an approved quote", async ({ page }) => {
    await page.goto("/dashboard/quotes");
    await page.getByRole("link").first().click();
    await page.getByRole("button", { name: /pay deposit & start project/i }).click();

    // Redirects to Stripe Checkout (hosted page) — assert we left the app.
    await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 15_000 });
  });

  test("client can track project progress and view files", async ({ page }) => {
    await page.goto("/dashboard/projects");
    await page.getByRole("link").first().click();

    await expect(page.getByText(/status/i)).toBeVisible();
    await page.getByRole("link", { name: /files|deliverables/i }).first().click();
  });
});
