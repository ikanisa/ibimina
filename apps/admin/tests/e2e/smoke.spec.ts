/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-enable @typescript-eslint/ban-ts-comment */

import { test, expect } from "@playwright/test";
import { setSession } from "./support/session";

test.beforeEach(async ({ request, page }) => {
  await setSession(request, page, "anonymous");
});

test.describe("core smoke", () => {
  test("login screen renders primary affordances", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1, name: /sacco\+/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await page.getByRole("textbox", { name: /email/i }).fill("staff@example.com");
    await page.getByLabel(/password/i).fill("hunter2!");
    await expect(page.getByRole("button", { name: /sign in/i })).toBeEnabled();
  });

  test("dashboard loads stub metrics when authenticated", async ({ page, request }) => {
    await setSession(request, page, "authenticated");
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /sacco overview/i })).toBeVisible();
    await expect(page.getByText("Imbere Heza", { exact: true })).toBeVisible();
    await expect(page.getByText("Abishyizehamwe", { exact: true })).toBeVisible();
  });
});
