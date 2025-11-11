import { expect, test } from "@playwright/test";
import { setSession } from "./support/session";

test.describe("SMS native hand-off", () => {
  test.beforeEach(async ({ page, request }) => {
    await setSession(request, page, "authenticated");
  });

  test("sms ingestion guidance renders without native bridge", async ({ page }) => {
    await page.goto("/settings/sms-ingestion");

    await expect(page.getByRole("heading", { name: /SMS ingestion hand-off/i })).toBeVisible();
    await expect(page.getByText("Supabase telemetry snapshot")).toBeVisible();
    await expect(page.getByRole("link", { name: /Launch in SACCO\+/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Refresh status/i })).toBeEnabled();
  });

  test("sms consent guidance surfaces audit trail", async ({ page }) => {
    await page.goto("/settings/sms-consent");

    await expect(page.getByRole("heading", { name: /SMS ingestion consent/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Open consent flow in app/i })).toBeVisible();
    await expect(page.getByText(/Supabase audit trail/i)).toBeVisible();
  });
});
