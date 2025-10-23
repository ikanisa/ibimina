"use strict";

import { afterEach, before, describe, it } from "node:test";
import assert from "node:assert/strict";

type LimitsModule = typeof import("@/src/auth/limits");
type RateLimitModule = typeof import("@/lib/rate-limit");
type ClientFactory = NonNullable<Parameters<RateLimitModule["__setRateLimitClientFactoryForTests"]>[0]>;
type SupabaseClientLike = Awaited<ReturnType<ClientFactory>>;

type SupabaseRpc = (fn: string, args: Record<string, unknown>) => Promise<unknown>;

const REQUIRED_ENV: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  BACKUP_PEPPER: "unit-test-pepper",
  MFA_SESSION_SECRET: "session-secret",
  TRUSTED_COOKIE_SECRET: "trusted-secret",
  OPENAI_API_KEY: "openai-test-key",
  HMAC_SHARED_SECRET: "hmac-secret",
  KMS_DATA_KEY: Buffer.alloc(32, 9).toString("base64"),
};

let applyRateLimit: LimitsModule["applyRateLimit"];
let preventTotpReplay: LimitsModule["preventTotpReplay"];
let resetRateLimitCaches: LimitsModule["__resetRateLimitCachesForTests"];
let setClientFactory: RateLimitModule["__setRateLimitClientFactoryForTests"];

const createClientFactory = (impl: SupabaseRpc): ClientFactory => {
  return async () => ({
    rpc: impl,
  } as unknown as SupabaseClientLike);
};

before(async () => {
  for (const [key, value] of Object.entries(REQUIRED_ENV)) {
    process.env[key] = value;
  }

  const [limitsModule, rateLimitModule] = await Promise.all([
    import("@/src/auth/limits"),
    import("@/lib/rate-limit"),
  ]);

  applyRateLimit = limitsModule.applyRateLimit;
  preventTotpReplay = limitsModule.preventTotpReplay;
  resetRateLimitCaches = limitsModule.__resetRateLimitCachesForTests;
  setClientFactory = rateLimitModule.__setRateLimitClientFactoryForTests;
});

describe("rate limit helpers", () => {
  afterEach(() => {
    setClientFactory(null);
    resetRateLimitCaches();
  });

  it("allows requests when Supabase RPC approves", async () => {
    setClientFactory(createClientFactory(async () => ({ data: true, error: null })));

    const result = await applyRateLimit("allow", { maxHits: 2, windowSeconds: 60 });
    assert.deepEqual(result, { ok: true });
  });

  it("blocks requests when Supabase RPC rejects", async () => {
    setClientFactory(createClientFactory(async () => ({ data: false, error: null })));

    const result = await applyRateLimit("blocked", { maxHits: 1, windowSeconds: 60 });
    assert.equal(result.ok, false);
    assert.ok(result.retryAt instanceof Date);
  });

  it("falls back to in-memory enforcement when Supabase RPC fails", async () => {
    setClientFactory(createClientFactory(async () => ({ data: null, error: new Error("db down") })));

    const first = await applyRateLimit("fallback", { maxHits: 1, windowSeconds: 1 });
    assert.deepEqual(first, { ok: true });

    const second = await applyRateLimit("fallback", { maxHits: 1, windowSeconds: 1 });
    assert.equal(second.ok, false);
    assert.ok(second.retryAt instanceof Date);
  });

  it("prevents TOTP replay within the same window", () => {
    const userId = "user-1";
    const step = 12345;

    assert.equal(preventTotpReplay(userId, step), true);
    assert.equal(preventTotpReplay(userId, step), false);

    resetRateLimitCaches();

    assert.equal(preventTotpReplay(userId, step), true);
  });
});
