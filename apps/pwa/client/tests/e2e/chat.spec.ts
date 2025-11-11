import { test, expect } from "@playwright/test";

test.describe("Chat agent", () => {
  test("streams allocation summary and renders bilingual results", async ({ page }) => {
    await page.goto("/chat");

    const composer = page.getByRole("textbox", { name: /umufasha|message/i });
    await composer.fill("Please share my statements");
    await page.getByRole("button", { name: /(Ohereza|Send)/i }).click();

    await expect(page.getByText(/Allocation summary/i)).toBeVisible();
    await expect(page.getByText(/Kigali Business Group/)).toBeVisible();
    await expect(page.getByText(/Nyamata Farmers/)).toBeVisible();
  });

  test("language toggle updates quick actions", async ({ page }) => {
    await page.goto("/chat");

    await page.getByRole("button", { name: "FR" }).click();
    await expect(page.getByRole("button", { name: /relevés/i })).toBeVisible();

    await page.getByRole("button", { name: "EN" }).click();
    await expect(page.getByRole("button", { name: /statements/i })).toBeVisible();

    await page.getByRole("button", { name: "RW" }).click();
    await expect(page.getByRole("button", { name: /raporo/i })).toBeVisible();
  });
});
