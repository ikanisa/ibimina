import { describe, it, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { createInitiateHandler } from "@/app/api/authx/challenge/initiate/route";
import type { initiateFactor as initiateFactorFn } from "@/src/auth/factors";

type TestUser = { id: string; email: string };

type MockInitiateResult = Awaited<ReturnType<typeof initiateFactorFn>>;

const buildRequest = (body: unknown) =>
  new NextRequest("http://localhost/api/authx/challenge/initiate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

describe("authx login API - challenge initiation", () => {
  const user: TestUser = { id: "user-1", email: "user@example.com" };

  afterEach(() => {
    mock.restoreAll();
    mock.reset();
  });

  it("rejects unauthenticated requests", async () => {
    const handler = createInitiateHandler({
      getSessionUser: async () => null,
    });

    const response = await handler(buildRequest({ factor: "totp" }));
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.error, "unauthenticated");
  });

  it("returns bad request on invalid payload", async () => {
    const handler = createInitiateHandler({
      getSessionUser: async () => user,
    });

    const response = await handler(buildRequest({ factor: "unknown" }));
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error, "invalid_payload");
  });

  it("initiates a valid factor challenge for the session user", async () => {
    const initiateResult: MockInitiateResult = {
      ok: true,
      status: 200,
      payload: { factor: "totp", channel: "email" },
    } as MockInitiateResult;

    const handler = createInitiateHandler({
      getSessionUser: async () => user,
      initiateFactor: async (input: any) => {
        assert.equal(input.factor, "totp");
        assert.equal(input.userId, user.id);
        assert.equal(input.email, user.email);
        return initiateResult;
      },
      logError: () => {},
    });

    const response = await handler(buildRequest({ factor: "totp" }));
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.factor, "totp");
    assert.equal(payload.channel, "email");
  });

  it("propagates rate limiting from the factor initiation handler", async () => {
    const handler = createInitiateHandler({
      getSessionUser: async () => user,
      initiateFactor: async () => ({
        ok: false,
        status: 429,
        error: "rate_limited",
        code: "MFA_RATE_LIMITED",
      }),
      logError: () => {},
    });

    const response = await handler(buildRequest({ factor: "email" }));
    const payload = await response.json();

    assert.equal(response.status, 429);
    assert.equal(payload.error, "rate_limited");
    assert.equal(payload.code, "MFA_RATE_LIMITED");
  });
});
