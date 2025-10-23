"use strict";

import { afterEach, before, describe, it } from "node:test";
import assert from "node:assert/strict";

import { generateBackupCodes } from "@/lib/mfa/crypto";

type BackupModule = typeof import("@/lib/authx/backup");
type SupabaseAdminClient = Parameters<BackupModule["__setSupabaseAdminClientForTests"]>[0];

type StubState = {
  hashes: string[];
  selectError?: Error | null;
  updateError?: Error | null;
  updatedPayload: { mfa_backup_hashes: string[] } | null;
};

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

let consumeBackup: BackupModule["consumeBackup"];
let setSupabaseAdminClientForTests: BackupModule["__setSupabaseAdminClientForTests"];

before(async () => {
  for (const [key, value] of Object.entries(REQUIRED_ENV)) {
    process.env[key] = value;
  }

  const backupModule = await import("@/lib/authx/backup");
  consumeBackup = backupModule.consumeBackup;
  setSupabaseAdminClientForTests = backupModule.__setSupabaseAdminClientForTests;
});

const buildSupabaseStub = (state: StubState): SupabaseAdminClient => {
  return ({
    from(table: string) {
      if (table !== "users") {
        throw new Error(`unexpected table ${table}`);
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: state.selectError ? null : { mfa_backup_hashes: state.hashes },
              error: state.selectError ?? null,
            }),
          }),
        }),
        update: (payload: unknown) => ({
          eq: async () => {
            state.updatedPayload = payload as { mfa_backup_hashes: string[] };
            return { error: state.updateError ?? null };
          },
        }),
      };
    },
  } as unknown) as SupabaseAdminClient;
};

describe("authx backup consumption", () => {
  afterEach(() => {
    setSupabaseAdminClientForTests(null);
  });

  it("consumes a valid backup code and persists remaining hashes", async () => {
    const records = generateBackupCodes(1);
    const [record] = records;
    const state: StubState = {
      hashes: records.map((entry) => entry.hash),
      updatedPayload: null,
    };

    setSupabaseAdminClientForTests(buildSupabaseStub(state));

    const result = await consumeBackup("user-id", record.code);
    assert.equal(result, true);
    assert.ok(state.updatedPayload, "expected update to be called");
    assert.equal(state.updatedPayload!.mfa_backup_hashes.length, 0);
  });

  it("returns false when Supabase read fails", async () => {
    const state: StubState = {
      hashes: [],
      selectError: new Error("boom"),
      updatedPayload: null,
    };

    setSupabaseAdminClientForTests(buildSupabaseStub(state));

    const result = await consumeBackup("user-id", "ANYCODE");
    assert.equal(result, false);
    assert.equal(state.updatedPayload, null);
  });

  it("returns false when the provided code does not match", async () => {
    const records = generateBackupCodes(1);
    const state: StubState = {
      hashes: records.map((entry) => entry.hash),
      updatedPayload: null,
    };

    setSupabaseAdminClientForTests(buildSupabaseStub(state));

    const result = await consumeBackup("user-id", "INVALID");
    assert.equal(result, false);
    assert.equal(state.updatedPayload, null);
  });
});
