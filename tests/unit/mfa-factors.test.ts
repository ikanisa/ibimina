import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  initiateFactor,
  type FactorInitiateResult,
  overrideInitiateHandlers,
  overrideVerifyHandlers,
  resetFactorOverrides,
  type Factor,
  type FactorSuccess,
  verifyFactor,
} from "@/src/auth/factors";

afterEach(() => {
  resetFactorOverrides();
});

describe("mfa factor facade", () => {
  const base = {
    token: "123456",
    userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    email: "user@example.com",
    rememberDevice: true,
    state: {
      totpSecret: "encrypted",
      lastStep: null,
      backupHashes: [] as string[],
    },
  } satisfies Omit<Parameters<typeof verifyFactor>[0], "factor">;

  const buildInput = (factor: Factor) => ({ ...base, factor });

  it("delegates to the totp adapter", async () => {
    let called = 0;
    overrideVerifyHandlers({
      totp: async () => {
        called += 1;
        const response: FactorSuccess = {
          ok: true as const,
          status: 200,
          factor: "totp",
          auditAction: "MFA_SUCCESS",
          auditDiff: null,
        };

        return response;
      },
    });

    const result = await verifyFactor(buildInput("totp"));

    assert.equal(result.ok, true);
    assert.equal(result.factor, "totp");
    assert.equal(called, 1);
  });

  it("returns downstream failures without modification", async () => {
    overrideVerifyHandlers({
      backup: async () => ({
        ok: false as const,
        status: 401,
        error: "invalid_backup",
        code: "INVALID_BACKUP",
      }),
    });

    const result = await verifyFactor(buildInput("backup"));

    assert.equal(result.ok, false);
    assert.equal(result.status, 401);
    assert.equal(result.error, "invalid_backup");
  });

  it("delegates email verification to the adapter", async () => {
    let called = 0;
    overrideVerifyHandlers({
      email: async () => {
        called += 1;
        const response: FactorSuccess = {
          ok: true as const,
          status: 200,
          factor: "email",
          auditAction: "MFA_SUCCESS",
          auditDiff: null,
        };

        return response;
      },
    });

    const result = await verifyFactor(buildInput("email"));

    assert.equal(result.ok, true);
    assert.equal(result.factor, "email");
    assert.equal(called, 1);
  });

  it("rejects unsupported factors", async () => {
    const result = await verifyFactor({ ...base, factor: "sms" as unknown as Factor });
    assert.equal(result.ok, false);
    assert.equal(result.status, 400);
    assert.equal(result.error, "unsupported_factor");
  });

  it("routes email initiation to the adapter", async () => {
    let called = 0;
    overrideInitiateHandlers({
      email: async () => {
        called += 1;
        const response: FactorInitiateResult = {
          ok: true as const,
          status: 202,
          payload: { delivery: "email" },
        };

        return response;
      },
    });

    const response = await initiateFactor({ factor: "email", userId: base.userId, email: base.email, phone: null });

    assert.equal(response.ok, true);
    assert.equal(response.status, 202);
    assert.equal(called, 1);
  });

  it("returns 501 for passkey initiation", async () => {
    const response = await initiateFactor({ factor: "passkey", userId: base.userId, email: base.email, phone: null });
    assert.equal(response.ok, false);
    assert.equal(response.status, 501);
  });

  it("invokes passkey verification when requested", async () => {
    let called = 0;
    overrideVerifyHandlers({
      passkey: async () => {
        called += 1;
        const response: FactorSuccess = {
          ok: true as const,
          status: 200,
          factor: "passkey",
          auditAction: "MFA_SUCCESS",
          auditDiff: null,
        };

        return response;
      },
    });

    const result = await verifyFactor(buildInput("passkey"));
    assert.equal(result.ok, true);
    assert.equal(called, 1);
  });

  it("invokes whatsapp initiation", async () => {
    let called = 0;
    overrideInitiateHandlers({
      whatsapp: async () => {
        called += 1;
        const response: FactorInitiateResult = {
          ok: true as const,
          status: 200,
          payload: { channel: "whatsapp" },
        };

        return response;
      },
    });

    const response = await initiateFactor({ factor: "whatsapp", userId: base.userId, phone: "+250788000000", email: null });
    assert.equal(response.ok, true);
    assert.equal(called, 1);
  });
});
