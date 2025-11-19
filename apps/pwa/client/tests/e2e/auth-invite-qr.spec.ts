import { test, expect, type Page } from "@playwright/test";

const stubSupabaseRoutes = (page: Page) => {
  page.route("**/functions/v1/whatsapp-otp-send", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
      }),
    });
  });

  page.route("**/functions/v1/whatsapp-otp-verify", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        session: { access_token: "access", refresh_token: "refresh" },
        attempts_remaining: 3,
      }),
    });
  });

  page.route("**/auth/v1/token**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "access",
        refresh_token: "refresh",
        user: { id: "user-1" },
      }),
    });
  });
};

test.describe("Auth, invite, and QR flows", () => {
  test("OTP login flow accepts valid phone numbers", async ({ page }) => {
    stubSupabaseRoutes(page);

    await page.goto("/login");
    await page.getByLabel(/WhatsApp Number/i).fill("0781234567");
    await page.getByRole("button", { name: /send code/i }).click();

    await expect(page.getByRole("heading", { name: /verify code/i })).toBeVisible();
    await page.getByLabel(/Verification Code/i).fill("123456");
    await page.getByRole("button", { name: /verify code/i }).click();
    await expect(page).toHaveURL(/redirectedFrom|home/);
  });

  test("share target invite preserves details", async ({ page, request }) => {
    const response = await request.post("/share-target", {
      form: {
        title: "Group Invite",
        text: "Join my ibimina",
        url: "https://example.com/invite/123",
      },
    });
    expect(response.status()).toBe(303);
    const redirect = response.headers()["location"] as string;
    await page.goto(redirect);
    await expect(page.getByText(/group invite/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /example.com\/invite\/123/i })).toBeVisible();
  });

  test("QR preview page renders reference card", async ({ page }) => {
    await page
      .context()
      .addCookies([{ name: "stub-auth", value: "1", domain: "localhost", path: "/" }]);

    await page.goto("/qr-preview");
    await expect(page.getByRole("heading", { name: /reference qr preview/i })).toBeVisible();
    await expect(page.getByText(/QR Code/i)).toBeVisible();
    await page.getByRole("button", { name: /copy reference/i }).click();
    await expect(page.getByRole("button", { name: /copied!/i })).toBeVisible();
  });
});
