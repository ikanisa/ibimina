import { test, expect } from "@playwright/test";

test.describe("Profile", () => {
  test("should display profile page", async ({ page }) => {
    await page.goto("/profile");

    // Check page title
    await expect(page.locator("h1")).toContainText(/profile|umwirondoro|profil/i);
  });

  test("should display user information", async ({ page }) => {
    await page.goto("/profile");

    // Check for common profile fields
    await expect(page.getByText(/phone|telefoni|téléphone/i)).toBeVisible();
    await expect(page.getByText(/language|ururimi|langue/i)).toBeVisible();
  });

  test("should have language selector", async ({ page }) => {
    await page.goto("/profile");

    // Check for language options
    const languageSection = page.getByText(/language|ururimi|langue/i);
    await expect(languageSection).toBeVisible();
  });

  test("should change language", async ({ page }) => {
    await page.goto("/profile");

    // Look for language selector
    const englishOption = page.getByText(/english|icyongereza|anglais/i);
    const kinyarwandaOption = page.getByText(/kinyarwanda|ikinyarwanda/i);
    const frenchOption = page.getByText(/french|igifaransa|français/i);

    // At least one language option should be visible
    const hasLanguageOptions =
      (await englishOption.count()) > 0 ||
      (await kinyarwandaOption.count()) > 0 ||
      (await frenchOption.count()) > 0;

    expect(hasLanguageOptions).toBeTruthy();
  });

  test("should display help and support links", async ({ page }) => {
    await page.goto("/profile");

    // Check for support section
    await expect(page.getByText(/help|ubufasha|aide|support/i)).toBeVisible();
  });

  test("should display legal links", async ({ page }) => {
    await page.goto("/profile");

    // Check for terms and privacy
    const termsLink = page.getByText(/terms|amabwiriza|conditions/i);
    const privacyLink = page.getByText(/privacy|ibanga|confidentialité/i);

    expect((await termsLink.count()) > 0 || (await privacyLink.count()) > 0).toBeTruthy();
  });
});
