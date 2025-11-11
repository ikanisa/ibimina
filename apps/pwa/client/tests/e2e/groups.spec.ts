import { test, expect } from "@playwright/test";

test.describe("Groups", () => {
  test("should display groups page", async ({ page }) => {
    await page.goto("/groups");

    // Check page title
    await expect(page.locator("h1")).toContainText(/groups|amatsinda|groupes/i);
  });

  test("should open join request dialog", async ({ page }) => {
    await page.goto("/groups");

    // Look for join button
    const joinButton = page.getByRole("button", { name: /join|injira|rejoindre/i }).first();
    if (await joinButton.isVisible()) {
      await joinButton.click();

      // Dialog should be visible
      await expect(page.getByRole("dialog")).toBeVisible();
    }
  });

  test("should submit join request", async ({ page }) => {
    await page.goto("/groups");

    const joinButton = page.getByRole("button", { name: /join|injira|rejoindre/i }).first();
    if (await joinButton.isVisible()) {
      await joinButton.click();

      // Fill optional note
      const noteInput = page.getByPlaceholder(/tell the group|bavugire|dites au groupe/i);
      if (await noteInput.isVisible()) {
        await noteInput.fill("I would like to join this group");

        // Submit request
        const submitButton = page.getByRole("button", { name: /send|ohereza|envoyer/i });
        await submitButton.click();

        // Should show success or pending state
        await expect(
          page.getByText(/pending|bitegerezwa|en attente|success|byagenze|succès/i)
        ).toBeVisible();
      }
    }
  });
});
