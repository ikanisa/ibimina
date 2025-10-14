import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hashOneTimeCode, verifyOneTimeCode, randomDigits, hashRateLimitKey } from "@/src/auth/util/crypto";
import { preventTotpReplay } from "@/src/auth/limits";

describe("auth security primitives", () => {
  it("produces unique numeric codes of requested length", () => {
    const first = randomDigits(6);
    const second = randomDigits(6);
    assert.equal(first.length, 6);
    assert.equal(second.length, 6);
    assert.notEqual(first, second);
    assert.match(first, /^\d+$/);
  });

  it("hashes and verifies one-time codes with pepper", () => {
    process.env.BACKUP_PEPPER = "test-pepper";
    const code = "123456";
    const hashed = hashOneTimeCode(code);
    assert.ok(hashed.includes("$"));
    assert.ok(verifyOneTimeCode(code, hashed));
    assert.ok(!verifyOneTimeCode("654321", hashed));
  });

  it("derives deterministic rate-limit keys without leaking identifiers", () => {
    process.env.RATE_LIMIT_SECRET = "limit-secret";
    const first = hashRateLimitKey("authx", "user-123");
    const second = hashRateLimitKey("authx", "user-123");
    const third = hashRateLimitKey("authx", "user-456");

    assert.equal(first, second);
    assert.notEqual(first, third);
    assert.equal(first.includes("user-123"), false);
  });

  it("prevents TOTP replay within the same step", () => {
    const userId = "user-123";
    const currentStep = 42;
    const first = preventTotpReplay(userId, currentStep);
    const second = preventTotpReplay(userId, currentStep);
    assert.equal(first, true);
    assert.equal(second, false);
  });
});
