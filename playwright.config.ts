import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: ".reports/playwright", open: "never" }],
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: [
      `AUTH_E2E_STUB=1`,
      `NEXT_PUBLIC_E2E=1`,
      `NEXT_PUBLIC_SUPABASE_URL=${process.env.PLAYWRIGHT_SUPABASE_URL ?? "http://127.0.0.1:54321"}`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.PLAYWRIGHT_SUPABASE_ANON_KEY ?? "stub-anon-key"}`,
      `MFA_SESSION_SECRET=${process.env.E2E_MFA_SESSION_SECRET ?? "stub-session-secret"}`,
      `TRUSTED_COOKIE_SECRET=${process.env.E2E_TRUSTED_COOKIE_SECRET ?? "stub-trusted-secret"}`,
      `BACKUP_PEPPER=${process.env.E2E_BACKUP_PEPPER ?? "playwright-pepper"}`,
      `E2E_BACKUP_PEPPER=${process.env.E2E_BACKUP_PEPPER ?? "playwright-pepper"}`,
      `RATE_LIMIT_SECRET=${process.env.E2E_RATE_LIMIT_SECRET ?? "playwright-rate-limit"}`,
      `KMS_DATA_KEY=${process.env.E2E_KMS_DATA_KEY ?? "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="}`,
      "pnpm",
      "run",
      "start",
    ].join(" "),
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
