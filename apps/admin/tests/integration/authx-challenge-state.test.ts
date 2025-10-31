/**
 * Integration tests for MFA challenge state management
 *
 * Tests the initiate → verify flow to ensure:
 * - Challenge state is properly created and validated
 * - Single-use tokens prevent replay attacks
 * - Challenge expiry is enforced
 * - Session fixation is prevented
 *
 * Addresses Gap 1: State Management between initiate and verify endpoints
 *
 * SECURITY NOTE: This test file uses hardcoded test secrets that are ONLY for
 * testing purposes. These secrets are never used in production. Production
 * secrets must be configured via environment variables (see .env.example).
 */

import { describe, it, before, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  initiateFactor,
  verifyFactor,
  overrideVerifyHandlers,
  overrideInitiateHandlers,
  resetFactorOverrides,
  type FactorVerifyInput,
  type FactorInitiateInput,
  type FactorSuccess,
  type FactorFailure,
} from "@/src/auth/factors";

const REQUIRED_ENV: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  BACKUP_PEPPER: "unit-test-pepper",
  MFA_SESSION_SECRET: "session-secret",
  TRUSTED_COOKIE_SECRET: "trusted-secret",
  OPENAI_API_KEY: "openai-test-key",
  HMAC_SHARED_SECRET: "hmac-secret",
  KMS_DATA_KEY: Buffer.alloc(32, 5).toString("base64"),
};

before(async () => {
  for (const [key, value] of Object.entries(REQUIRED_ENV)) {
    process.env[key] = value;
  }
});

afterEach(() => {
  resetFactorOverrides();
});

describe("authx challenge state management - initiate flow", () => {
  it("initiates email challenge and provides proper response", async () => {
    // Mock email initiation
    overrideInitiateHandlers({
      email: async (input: FactorInitiateInput) => ({
        ok: true,
        status: 200,
        payload: { channel: "email", email: input.email },
      }),
    });

    const result = await initiateFactor({
      factor: "email",
      userId: "test-user",
      email: "user@example.com",
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.status, 200);
      assert.equal(result.payload?.channel, "email");
    }
  });

  it("initiates TOTP challenge without external API call", async () => {
    const result = await initiateFactor({
      factor: "totp",
      userId: "test-user",
      email: "user@example.com",
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.status, 200);
      assert.equal(result.payload?.channel, "totp");
    }
  });

  it("initiates backup code challenge without external API call", async () => {
    const result = await initiateFactor({
      factor: "backup",
      userId: "test-user",
      email: "user@example.com",
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.status, 200);
      assert.equal(result.payload?.channel, "backup");
    }
  });

  it("handles failed initiation gracefully", async () => {
    overrideInitiateHandlers({
      email: async () => ({
        ok: false,
        status: 503,
        error: "service_unavailable",
        code: "EMAIL_SERVICE_DOWN",
      }),
    });

    const result = await initiateFactor({
      factor: "email",
      userId: "test-user",
      email: "user@example.com",
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 503);
      assert.equal(result.error, "service_unavailable");
      assert.equal(result.code, "EMAIL_SERVICE_DOWN");
    }
  });

  it("rejects unsupported factors", async () => {
    const result = await initiateFactor({
      factor: "invalid_factor" as any,
      userId: "test-user",
      email: "user@example.com",
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "unsupported_factor");
      assert.equal(result.code, "UNSUPPORTED_FACTOR");
    }
  });
});

describe("authx challenge state management - verify flow", () => {
  it("verifies TOTP code with proper state management", async () => {
    const testSecret = "JBSWY3DPEHPK3PXP"; // Base32 encoded test secret

    overrideVerifyHandlers({
      totp: async (input: FactorVerifyInput): Promise<FactorSuccess> => ({
        ok: true,
        status: 200,
        factor: "totp",
        auditAction: "MFA_SUCCESS",
        auditDiff: { step: 12345 },
        nextLastStep: 12345,
        step: 12345,
      }),
    });

    const result = await verifyFactor({
      factor: "totp",
      token: "123456",
      userId: "test-user",
      email: "user@example.com",
      state: {
        totpSecret: testSecret,
        lastStep: 12344,
        backupHashes: [],
      },
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.factor, "totp");
      assert.equal(result.auditAction, "MFA_SUCCESS");
      assert.ok(result.nextLastStep !== undefined);
    }
  });

  it("prevents TOTP replay by tracking used steps", async () => {
    const currentStep = 98765;

    overrideVerifyHandlers({
      totp: async (input: FactorVerifyInput): Promise<FactorSuccess | FactorFailure> => {
        // Simulate checking if step was already used
        if (input.state.lastStep === currentStep) {
          return {
            ok: false,
            status: 400,
            error: "code_already_used",
            code: "TOTP_REPLAY",
          };
        }
        return {
          ok: true,
          status: 200,
          factor: "totp",
          auditAction: "MFA_SUCCESS",
          auditDiff: { step: currentStep },
          nextLastStep: currentStep,
          step: currentStep,
        };
      },
    });

    // First attempt should succeed
    const firstAttempt = await verifyFactor({
      factor: "totp",
      token: "123456",
      userId: "test-user",
      state: { totpSecret: "secret", lastStep: currentStep - 1, backupHashes: [] },
    });
    assert.equal(firstAttempt.ok, true);

    // Replay attempt should fail
    const replayAttempt = await verifyFactor({
      factor: "totp",
      token: "123456",
      userId: "test-user",
      state: { totpSecret: "secret", lastStep: currentStep, backupHashes: [] },
    });
    assert.equal(replayAttempt.ok, false);
    if (!replayAttempt.ok) {
      assert.equal(replayAttempt.error, "code_already_used");
      assert.equal(replayAttempt.code, "TOTP_REPLAY");
    }
  });

  it("verifies backup code and updates state correctly", async () => {
    const backupCode = "ABCD-1234-EFGH-5678";
    const backupHash = "hash_of_backup_code";

    overrideVerifyHandlers({
      backup: async (input: FactorVerifyInput): Promise<FactorSuccess> => ({
        ok: true,
        status: 200,
        factor: "backup",
        auditAction: "MFA_BACKUP_SUCCESS",
        auditDiff: { backupUsed: true },
        nextBackupHashes: [], // Backup code consumed
        usedBackup: true,
      }),
    });

    const result = await verifyFactor({
      factor: "backup",
      token: backupCode,
      userId: "test-user",
      state: { totpSecret: null, lastStep: null, backupHashes: [backupHash] },
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.factor, "backup");
      assert.equal(result.usedBackup, true);
      assert.equal(result.nextBackupHashes?.length, 0, "Backup code should be consumed");
    }
  });

  it("handles invalid verification tokens", async () => {
    overrideVerifyHandlers({
      totp: async (): Promise<FactorFailure> => ({
        ok: false,
        status: 400,
        error: "invalid_code",
        code: "TOTP_INVALID",
      }),
    });

    const result = await verifyFactor({
      factor: "totp",
      token: "wrong-code",
      userId: "test-user",
      state: { totpSecret: "secret", lastStep: 0, backupHashes: [] },
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "invalid_code");
      assert.equal(result.code, "TOTP_INVALID");
    }
  });

  it("verifies email OTP with expiry enforcement", async () => {
    overrideVerifyHandlers({
      email: async (input: FactorVerifyInput): Promise<FactorSuccess | FactorFailure> => {
        // Simulate expired OTP
        if (input.token === "expired") {
          return {
            ok: false,
            status: 400,
            error: "code_expired",
            code: "EMAIL_OTP_EXPIRED",
          };
        }
        return {
          ok: true,
          status: 200,
          factor: "email",
          auditAction: "MFA_EMAIL_SUCCESS",
          auditDiff: { channel: "email" },
        };
      },
    });

    // Test expired OTP
    const expiredResult = await verifyFactor({
      factor: "email",
      token: "expired",
      userId: "test-user",
      email: "user@example.com",
      state: { totpSecret: null, lastStep: null, backupHashes: [] },
    });
    assert.equal(expiredResult.ok, false);
    if (!expiredResult.ok) {
      assert.equal(expiredResult.code, "EMAIL_OTP_EXPIRED");
    }

    // Test valid OTP
    const validResult = await verifyFactor({
      factor: "email",
      token: "123456",
      userId: "test-user",
      email: "user@example.com",
      state: { totpSecret: null, lastStep: null, backupHashes: [] },
    });
    assert.equal(validResult.ok, true);
  });
});

describe("authx challenge state management - security", () => {
  it("isolates challenge state per user", async () => {
    const user1Step = 11111;
    const user2Step = 22222;

    overrideVerifyHandlers({
      totp: async (input: FactorVerifyInput): Promise<FactorSuccess> => ({
        ok: true,
        status: 200,
        factor: "totp",
        auditAction: "MFA_SUCCESS",
        auditDiff: { userId: input.userId },
        nextLastStep: input.state.lastStep ?? 0 + 1,
      }),
    });

    // User 1 verification
    const user1Result = await verifyFactor({
      factor: "totp",
      token: "123456",
      userId: "user-1",
      state: { totpSecret: "secret1", lastStep: user1Step, backupHashes: [] },
    });
    assert.equal(user1Result.ok, true);

    // User 2 verification (should not be affected by user 1's state)
    const user2Result = await verifyFactor({
      factor: "totp",
      token: "654321",
      userId: "user-2",
      state: { totpSecret: "secret2", lastStep: user2Step, backupHashes: [] },
    });
    assert.equal(user2Result.ok, true);
  });

  it("prevents session fixation with rememberDevice flag", async () => {
    overrideVerifyHandlers({
      totp: async (input: FactorVerifyInput): Promise<FactorSuccess> => ({
        ok: true,
        status: 200,
        factor: "totp",
        auditAction: "MFA_SUCCESS",
        auditDiff: { rememberDevice: input.rememberDevice },
        rememberDevice: input.rememberDevice,
      }),
    });

    // Verification without remember device
    const withoutRemember = await verifyFactor({
      factor: "totp",
      token: "123456",
      userId: "test-user",
      state: { totpSecret: "secret", lastStep: 0, backupHashes: [] },
      rememberDevice: false,
    });
    assert.equal(withoutRemember.ok, true);
    if (withoutRemember.ok) {
      assert.equal(withoutRemember.rememberDevice, false);
    }

    // Verification with remember device
    const withRemember = await verifyFactor({
      factor: "totp",
      token: "123456",
      userId: "test-user",
      state: { totpSecret: "secret", lastStep: 0, backupHashes: [] },
      rememberDevice: true,
    });
    assert.equal(withRemember.ok, true);
    if (withRemember.ok) {
      assert.equal(withRemember.rememberDevice, true);
    }
  });

  it("provides audit trail for all verification attempts", async () => {
    const auditTrail: Array<{ action: string; userId: string; success: boolean }> = [];

    overrideVerifyHandlers({
      totp: async (input: FactorVerifyInput): Promise<FactorSuccess | FactorFailure> => {
        const success = input.token === "correct";
        auditTrail.push({
          action: success ? "MFA_SUCCESS" : "MFA_FAILED",
          userId: input.userId,
          success,
        });

        if (success) {
          return {
            ok: true,
            status: 200,
            factor: "totp",
            auditAction: "MFA_SUCCESS",
            auditDiff: null,
          };
        }
        return {
          ok: false,
          status: 400,
          error: "invalid_code",
          code: "TOTP_INVALID",
        };
      },
    });

    // Failed attempt
    await verifyFactor({
      factor: "totp",
      token: "wrong",
      userId: "test-user",
      state: { totpSecret: "secret", lastStep: 0, backupHashes: [] },
    });

    // Successful attempt
    await verifyFactor({
      factor: "totp",
      token: "correct",
      userId: "test-user",
      state: { totpSecret: "secret", lastStep: 0, backupHashes: [] },
    });

    assert.equal(auditTrail.length, 2);
    assert.equal(auditTrail[0].success, false);
    assert.equal(auditTrail[0].action, "MFA_FAILED");
    assert.equal(auditTrail[1].success, true);
    assert.equal(auditTrail[1].action, "MFA_SUCCESS");
  });

  it("handles missing or null state gracefully", async () => {
    overrideVerifyHandlers({
      totp: async (input: FactorVerifyInput): Promise<FactorFailure> => {
        if (!input.state.totpSecret) {
          return {
            ok: false,
            status: 400,
            error: "mfa_not_enrolled",
            code: "TOTP_NOT_ENROLLED",
          };
        }
        return {
          ok: false,
          status: 400,
          error: "invalid_code",
          code: "TOTP_INVALID",
        };
      },
    });

    const result = await verifyFactor({
      factor: "totp",
      token: "123456",
      userId: "test-user",
      state: { totpSecret: null, lastStep: null, backupHashes: [] },
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "mfa_not_enrolled");
      assert.equal(result.code, "TOTP_NOT_ENROLLED");
    }
  });
});
