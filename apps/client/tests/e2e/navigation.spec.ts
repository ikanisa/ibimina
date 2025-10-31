import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should navigate between pages", async ({ page }) => {
    await page.goto("/");

    // Should redirect to home
    await expect(page).toHaveURL("/home");

    // Navigate to Groups
    await page.click('[aria-label="Groups"]');
    await expect(page).toHaveURL("/groups");

    // Navigate to Pay
    await page.click('[aria-label="Pay"]');
    await expect(page).toHaveURL("/pay");

    // Navigate to Statements
    await page.click('[aria-label="Statements"]');
    await expect(page).toHaveURL("/statements");

    // Navigate to Profile
    await page.click('[aria-label="Profile"]');
    await expect(page).toHaveURL("/profile");

    // Navigate back to Home
    await page.click('[aria-label="Home"]');
    await expect(page).toHaveURL("/home");
  });

  test("should have correct page titles", async ({ page }) => {
    await page.goto("/home");
    await expect(page.locator("h1")).toContainText(/welcome|murakaza|bon retour/i);

    await page.goto("/groups");
    await expect(page.locator("h1")).toContainText(/groups|amatsinda/i);

    await page.goto("/statements");
    await expect(page.locator("h1")).toContainText(/statements|raporo|relevés/i);

    await page.goto("/profile");
    await expect(page.locator("h1")).toContainText(/profile|umwirondoro|profil/i);
  });

  test("should have skip to content link", async ({ page }) => {
    await page.goto("/");

    // Tab to focus skip link
    await page.keyboard.press("Tab");

    // Verify skip link is focused
    const skipLink = page.getByText(/skip to content|simbuka ku birimwo|aller au contenu/i);
    await expect(skipLink).toBeFocused();
  });
});
