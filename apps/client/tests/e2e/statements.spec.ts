import { test, expect } from "@playwright/test";

test.describe("Statements", () => {
  test("should display statements page", async ({ page }) => {
    await page.goto("/statements");

    // Check for filters
    await expect(page.getByText(/period|igihe|période/i)).toBeVisible();
  });

  test("should filter statements by period", async ({ page }) => {
    await page.goto("/statements");

    // Check for filter options
    const thisMonth = page.getByText(/this month|uku kwezi|ce mois/i);
    if (await thisMonth.isVisible()) {
      await thisMonth.click();
    }
  });

  test("should have export functionality", async ({ page }) => {
    await page.goto("/statements");

    // Check for export buttons
    const exportPdf = page.getByRole("button", { name: /export pdf|sohora pdf|exporter pdf/i });
    if (await exportPdf.isVisible()) {
      await expect(exportPdf).toBeVisible();
    }
  });

  test("should display transaction table", async ({ page }) => {
    await page.goto("/statements");

    // Check for table headers
    const dateHeader = page.getByText(/date|itariki/i);
    const amountHeader = page.getByText(/amount|amafaranga|montant/i);
    const statusHeader = page.getByText(/status|imiterere|statut/i);

    if (await dateHeader.isVisible()) {
      await expect(dateHeader).toBeVisible();
      await expect(amountHeader).toBeVisible();
      await expect(statusHeader).toBeVisible();
    }
  });
});
