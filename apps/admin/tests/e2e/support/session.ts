/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-enable @typescript-eslint/ban-ts-comment */

import type { APIRequestContext, Page } from "@playwright/test";

export type SessionState = "authenticated" | "anonymous";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

/**
 * Mirrors the stubbed session state into both the API harness and the browser context
 * so React server components see consistent authentication on navigations.
 */
export async function setSession(request: APIRequestContext, page: Page, state: SessionState) {
  if (state === "anonymous") {
    await request.delete("/api/e2e/session");
    await page.context().clearCookies();
    return;
  }

  await request.post("/api/e2e/session", { data: { state } });
  await page.context().addCookies([
    {
      name: "stub-auth",
      value: "1",
      url: BASE_URL,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}
