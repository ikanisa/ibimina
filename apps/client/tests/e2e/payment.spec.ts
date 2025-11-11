import { test, expect } from "@playwright/test";

test.describe("Payment Flow", () => {
  test("should display USSD payment instructions", async ({ page }) => {
    await page.goto("/pay");

    // Check for merchant code
    await expect(page.getByText(/merchant code|kode ya mucuruzi|code marchand/i)).toBeVisible();

    // Check for reference token
    await expect(page.getByText(/reference|nomero/i)).toBeVisible();
  });

  test("should copy reference number", async ({ page }) => {
    await page.goto("/pay");

    // Find and click copy button
    const copyButton = page.getByRole("button", { name: /copy|kopi|copier/i }).first();
    await copyButton.click();

    // Verify copied message appears
    await expect(page.getByText(/copied|yakopowe|copié/i)).toBeVisible();
  });

  test("should handle payment marked as paid", async ({ page }) => {
    await page.goto("/pay");

    // Click "I've Paid" button
    const paidButton = page
      .getByRole("button", { name: /i've paid|narishyuye|j'ai payé/i })
      .first();
    if (await paidButton.isVisible()) {
      await paidButton.click();

      // Should show pending status
      await expect(page.getByText(/pending|bitegerezwa|en attente/i)).toBeVisible();
    }
  });

  test("should have accessible payment forms", async ({ page }) => {
    await page.goto("/pay");

    // All buttons should be accessible
    const buttons = page.getByRole("button");
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      await expect(button).toBeVisible();
    }
  });
});
