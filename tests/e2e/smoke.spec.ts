import { test, expect, type APIRequestContext } from "@playwright/test";

type SessionState = "authenticated" | "anonymous";

async function setSession(request: APIRequestContext, state: SessionState) {
  if (state === "anonymous") {
    await request.delete("/api/__e2e/session");
    return;
  }

  await request.post("/api/__e2e/session", { data: { state } });
}

test.beforeEach(async ({ request }) => {
  await setSession(request, "anonymous");
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
    await setSession(request, "authenticated");
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /sacco overview/i })).toBeVisible();
    await expect(page.getByText(/Imbere Heza/)).toBeVisible();
    await expect(page.getByText(/Abishyizehamwe/)).toBeVisible();
  });

  test("offline queue indicator exposes queued actions", async ({ page, request }) => {
    await setSession(request, "authenticated");
    await page.goto("/dashboard");
    await page.waitForSelector("text=/Quick actions/i");

    await page.evaluate(async () => {
      const harness = window.__offlineQueueTest;
      await harness?.clearAll?.();
      harness?.setOnline(false);
      await harness?.queueAction({
        type: "tests:action",
        payload: {},
        summary: { primary: "Queued by tests", secondary: "Smoke coverage" },
      });
    });

    const indicator = page.getByRole("button", { name: /offline/i });
    await expect(indicator).toBeVisible();
    await indicator.click();
    await expect(page.getByRole("dialog", { name: /offline queue/i })).toBeVisible();
  });
});
