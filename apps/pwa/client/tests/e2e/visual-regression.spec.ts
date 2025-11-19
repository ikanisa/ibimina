import { expect, test } from "@playwright/test";

test.describe("Visual regressions", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("welcome flow", async ({ page }) => {
    await page.goto("/welcome");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("welcome.png", { fullPage: true });
  });

  test("groups flow", async ({ page }) => {
    await page.goto("/groups");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("groups.png", { fullPage: true });
  });

  test("pay sheet flow", async ({ page }) => {
    await page.goto("/pay-sheet");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("pay-sheet.png", { fullPage: true });
  });
});
