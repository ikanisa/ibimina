/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-enable @typescript-eslint/ban-ts-comment */

import { test, expect } from "@playwright/test";
import { currentStep, getOtpForStep } from "@/lib/mfa/crypto";
import { hashOneTimeCode } from "@/src/auth/util/crypto";

const TOTP_SECRET = "JBSWY3DPEHPK3PXP";
const BASE_USER = "00000000-0000-4000-8000-000000000000";

const ensurePepper = () => {
  if (!process.env.BACKUP_PEPPER) {
    process.env.BACKUP_PEPPER = process.env.E2E_BACKUP_PEPPER ?? "playwright-pepper";
  }
};

test.describe("MFA factor facade", () => {
  test.beforeEach(async ({ request }) => {
    await request.post("/api/e2e/session", { data: { state: "authenticated" } });
    ensurePepper();
  });

  test("rejects invalid TOTP tokens", async ({ request }) => {
    const response = await request.post("/api/e2e/factors/verify", {
      data: {
        factor: "totp",
        token: "000000",
        userId: BASE_USER,
        plaintextTotpSecret: TOTP_SECRET,
      },
    });

    expect(response.status()).toBe(401);
    const payload = await response.json();
    expect(payload.ok).toBeFalsy();
    expect(payload.error).toBe("invalid_code");
  });

  test("accepts valid TOTP tokens", async ({ request }) => {
    const step = currentStep();
    const token = getOtpForStep(TOTP_SECRET, step);

    const response = await request.post("/api/e2e/factors/verify", {
      data: {
        factor: "totp",
        token,
        userId: "10000000-0000-4000-8000-000000000000",
        plaintextTotpSecret: TOTP_SECRET,
      },
    });

    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload.ok).toBeTruthy();
    expect(payload.factor).toBe("totp");
  });

  test("prevents TOTP replay for the same user", async ({ request }) => {
    const step = currentStep();
    const token = getOtpForStep(TOTP_SECRET, step);
    const userId = "20000000-0000-4000-8000-000000000000";

    const first = await request.post("/api/e2e/factors/verify", {
      data: {
        factor: "totp",
        token,
        userId,
        plaintextTotpSecret: TOTP_SECRET,
      },
    });
    expect(first.status()).toBe(200);

    const second = await request.post("/api/e2e/factors/verify", {
      data: {
        factor: "totp",
        token,
        userId,
        plaintextTotpSecret: TOTP_SECRET,
      },
    });

    expect(second.status()).toBe(401);
    const payload = await second.json();
    expect(payload.code).toBe("REPLAY_BLOCKED");
  });

  test("consumes backup codes", async ({ request }) => {
    ensurePepper();
    const backupCode = "ALPHA-1234";
    const hashed = hashOneTimeCode(backupCode.replace(/[^A-Z0-9]/gi, ""));

    const response = await request.post("/api/e2e/factors/verify", {
      data: {
        factor: "backup",
        token: backupCode,
        userId: "30000000-0000-4000-8000-000000000000",
        state: {
          totpSecret: null,
          lastStep: null,
          backupHashes: [hashed],
        },
      },
    });

    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload.ok).toBeTruthy();
    expect(Array.isArray(payload.nextBackupHashes)).toBeTruthy();
    expect(payload.nextBackupHashes.length).toBe(0);
  });
});
