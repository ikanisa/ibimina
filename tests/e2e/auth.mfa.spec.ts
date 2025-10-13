/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-enable @typescript-eslint/ban-ts-comment */
// Playwright smoke tests for MFA flows. These scenarios rely on seeded fixtures
// and are designed to run against the preview deployment or local Supabase test
// database. They are currently skipped until CI wiring is completed.

import { test, expect } from "@playwright/test";

const MFA_USER_EMAIL = process.env.E2E_MFA_EMAIL ?? "staff@example.com";
const MFA_USER_PASSWORD = process.env.E2E_MFA_PASSWORD ?? "P@ssword123";

const performLogin = async (page) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(MFA_USER_EMAIL);
  await page.getByLabel(/password/i).fill(MFA_USER_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
};

test.describe.skip("MFA verification", () => {
  test("rejects invalid TOTP token", async ({ page }) => {
    await performLogin(page);
    await expect(page.getByRole("heading", { name: /verify/i })).toBeVisible();
    await page.getByLabel(/code/i).fill("000000");
    await page.getByRole("button", { name: /verify/i }).click();
    await expect(page.getByText(/invalid_code/i)).toBeVisible();
  });

  test("accepts valid TOTP token and issues trusted device cookie", async ({ page }) => {
    await performLogin(page);
    await page.getByLabel(/code/i).fill(process.env.E2E_MFA_TOTP ?? "123456");
    await page.getByLabel(/remember device/i).check();
    await page.getByRole("button", { name: /verify/i }).click();
    await expect(page).toHaveURL(/dashboard/);
    const cookies = await page.context().cookies();
    expect(cookies.some((cookie) => cookie.name === "mfa_session")).toBeTruthy();
  });

  test("email OTP flow", async ({ page }) => {
    await performLogin(page);
    await page.getByRole("button", { name: /email code/i }).click();
    await expect(page.getByText(/email sent/i)).toBeVisible();
    await page.getByLabel(/code/i).fill(process.env.E2E_EMAIL_CODE ?? "654321");
    await page.getByRole("button", { name: /verify/i }).click();
    await expect(page).toHaveURL(/dashboard/);
  });

  test("whatsapp fallback is feature flagged", async ({ page }) => {
    await performLogin(page);
    await expect(page.getByRole("button", { name: /whatsapp/i })).toBeDisabled();
  });
});
