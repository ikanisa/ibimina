/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-enable @typescript-eslint/ban-ts-comment */

import { test, expect, type APIRequestContext } from "@playwright/test";

type SessionState = "authenticated" | "anonymous";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

async function setSession(request: APIRequestContext, page: Page, state: SessionState) {
  if (state === "anonymous") {
    await request.delete("/api/__e2e/session");
    // Clear cookie from browser context as well
    await page.context().clearCookies();
    return;
  }

  await request.post("/api/__e2e/session", { data: { state } });
  // Mirror the stub cookie into the browser context so server components
  // see an authenticated session on navigations.
  await page.context().addCookies([
    {
      name: "stub-auth",
      value: "1",
      url: BASE_URL,
      httpOnly: true,
      sameSite: "Lax",
      // leave `secure` unset so it is sent over http during tests
    },
  ]);
}

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

  test("offline queue indicator exposes queued actions", async ({ page, request }) => {
    await setSession(request, page, "authenticated");
    await page.goto("/dashboard");
    await page.waitForSelector("text=/Quick actions/i");

    // Simulate offline so the indicator appears even with 0 actions
    await page.context().setOffline(true);
    await page.waitForFunction(() => navigator.onLine === false);

    await page.waitForSelector('button[aria-controls="offline-queue-panel"]');
    const indicator = page.locator('button[aria-controls="offline-queue-panel"]');
    await expect(indicator).toBeVisible();
    await indicator.click();
    const panel = page.locator('#offline-queue-panel');
    await expect(panel).toBeVisible();
    await expect(panel.getByText(/offline queue/i)).toBeVisible();
  });
});
