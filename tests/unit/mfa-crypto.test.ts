"use strict";

import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  consumeBackupCode,
  decryptSensitiveString,
  encryptSensitiveString,
  generateBackupCodes,
  generateTotpSecret,
  getOtpForStep,
  verifyTotp,
} from "@/lib/mfa/crypto";

const envSnapshot = new Map<string, string | undefined>();
const managedKeys = ["KMS_DATA_KEY", "BACKUP_PEPPER"] as const;

describe("mfa crypto helpers", () => {
  beforeEach(() => {
    envSnapshot.clear();
    for (const key of managedKeys) {
      envSnapshot.set(key, process.env[key]);
    }
    process.env.KMS_DATA_KEY = Buffer.alloc(32, 7).toString("base64");
    process.env.BACKUP_PEPPER = "unit-test-pepper";
  });

  afterEach(() => {
    for (const key of managedKeys) {
      const original = envSnapshot.get(key);
      if (original === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original;
      }
    }
    envSnapshot.clear();
  });

  it("encrypts and decrypts sensitive payloads", () => {
    const secret = "sensitive-value";
    const encrypted = encryptSensitiveString(secret);
    assert.ok(encrypted.length > 0, "encrypted payload should not be empty");
    const decrypted = decryptSensitiveString(encrypted);
    assert.equal(decrypted, secret);
  });

  it("generates backup codes that can be consumed once", () => {
    const records = generateBackupCodes(2);
    assert.equal(records.length, 2);
    const hashes = records.map((record) => record.hash);

    const nextHashes = consumeBackupCode(records[0]!.code, hashes);
    assert.ok(nextHashes, "valid backup code should return remaining hashes");
    assert.equal(nextHashes.length, 1);
    assert.ok(!nextHashes.includes(records[0]!.hash));

    const secondAttempt = consumeBackupCode(records[0]!.code, nextHashes);
    assert.equal(secondAttempt, null, "consumed code cannot be reused");
  });

  it("verifies the current TOTP code for a generated secret", () => {
    const secret = generateTotpSecret();
    const currentStep = Math.floor(Date.now() / 1000 / 30);
    const code = getOtpForStep(secret, currentStep);
    const result = verifyTotp(secret, code);
    assert.equal(result.ok, true);
    assert.equal(result.step, currentStep);

    const invalid = verifyTotp(secret, "000000");
    assert.equal(invalid.ok, false);
  });
});
