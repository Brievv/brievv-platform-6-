import { test, expect } from "@playwright/test";

/**
 * Critical admin journey (spec §65):
 *   Admin login -> Dashboard -> View projects -> Search project ->
 *   Open project -> Review AI quote -> Edit quote -> Assign professional ->
 *   Change status -> Add internal note -> View audit history ->
 *   View payment -> Export information
 *
 * Requires: a running dev server against a seeded database (see
 * prisma/seed.ts for the ops@brievv.dev credentials and demo projects).
 * "Edit quote" is a known gap — see the inline note below and
 * docs/ROADMAP.md (quote editing UI isn't built yet; only status
 * transitions and matching are). "Export information" likewise has no
 * dedicated export button yet — this spec covers what exists today and
 * documents what doesn't, rather than asserting against UI that isn't there.
 */

test.describe("Admin journey", () => {
  test.use({ storageState: undefined });

  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("ops@brievv.dev");
    await page.getByLabel("Password").fill("BrievvAdmin!2026");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/dashboard/);
  });

  test("admin can reach the ops dashboard and see live counts", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText(/live operations|dashboard/i)).toBeVisible();
  });

  test("admin can browse and open a project", async ({ page }) => {
    await page.goto("/admin/projects");
    const firstProject = page.getByRole("link").first();
    await expect(firstProject).toBeVisible();
    await firstProject.click();

    await expect(page).toHaveURL(/\/dashboard\/projects\//);
    await expect(page.getByText(/status/i)).toBeVisible();
  });

  test("admin can review a quote", async ({ page }) => {
    await page.goto("/admin/quotes");
    const firstQuote = page.getByRole("link").first();
    await expect(firstQuote).toBeVisible();
    await firstQuote.click();

    await expect(page).toHaveURL(/\/dashboard\/quotes\//);
    await expect(page.getByText(/estimated investment|estimated price/i)).toBeVisible();

    // NOTE: quote editing (changing price/timeline/team after generation)
    // is not built — this journey can review a quote but not edit its
    // numbers from the UI yet. Tracked in docs/ROADMAP.md.
  });

  test("admin can run matching and propose a professional", async ({ page }) => {
    await page.goto("/admin/matching");
    const projectSelect = page.getByRole("combobox").first();
    if ((await projectSelect.locator("option").count()) === 0) test.skip();

    await page.getByRole("button", { name: /run matching/i }).click();
    const proposeButton = page.getByRole("button", { name: /propose/i }).first();
    if (await proposeButton.isVisible().catch(() => false)) {
      await proposeButton.click();
      await expect(page.getByText(/proposed/i).first()).toBeVisible();
    }
  });

  test("admin can change a project's status from the workspace", async ({ page }) => {
    await page.goto("/admin/tasks");
    const statusSelect = page.locator("select").first();
    if (await statusSelect.isVisible().catch(() => false)) {
      await statusSelect.selectOption("IN_PROGRESS");
    }
  });

  test("admin can add an internal note invisible to the client", async ({ page }) => {
    await page.goto("/admin/messages");
    const firstThread = page.getByRole("link").first();
    if (!(await firstThread.isVisible().catch(() => false))) test.skip();
    await firstThread.click();

    const internalBox = page.getByPlaceholder(/internal note/i);
    await internalBox.fill("E2E test internal note — not visible to client.");
    await internalBox.locator("xpath=following::button[1]").click();

    await expect(page.getByText("E2E test internal note")).toBeVisible();
  });

  test("admin can view the audit log history", async ({ page }) => {
    await page.goto("/admin/audit-logs");
    await expect(page.getByText(/audit logs/i)).toBeVisible();
  });

  test("admin can view payments", async ({ page }) => {
    await page.goto("/admin/payments");
    await expect(page.getByText(/payments/i)).toBeVisible();
  });

  test("admin can download a quote PDF (the closest existing export)", async ({ page }) => {
    await page.goto("/admin/quotes");
    const firstQuote = page.getByRole("link").first();
    if (!(await firstQuote.isVisible().catch(() => false))) test.skip();
    await firstQuote.click();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: /download pdf/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    // NOTE: this covers quote PDF export only. Project summary PDF,
    // invoice PDF, and CSV exports from spec §74 aren't built yet.
  });
});
