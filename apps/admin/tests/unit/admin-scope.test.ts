import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveTenantScope } from "@/lib/admin/scope";
import type { ProfileRow } from "@/lib/auth";

function buildProfile(overrides: Partial<ProfileRow>): ProfileRow {
  return {
    id: "user-1",
    email: "user@example.com",
    role: "SYSTEM_ADMIN",
    sacco_id: null,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    mfa_enabled: false,
    mfa_enrolled_at: null,
    mfa_passkey_enrolled: false,
    mfa_methods: [],
    mfa_backup_hashes: [],
    failed_mfa_count: 0,
    last_mfa_success_at: null,
    last_mfa_step: null,
    phone: null,
    phone_confirmed_at: null,
    email_confirmed_at: null,
    recovery_codes: null,
    recovery_codes_generated_at: null,
    mfa_totp_verified_at: null,
    metadata: null,
    deactivated_at: null,
    invited_at: null,
    last_sign_in_at: null,
    saccos: null,
    ...overrides,
  } as ProfileRow;
}

describe("resolveTenantScope", () => {
  it("returns global scope for system admin without filter", () => {
    const scope = resolveTenantScope(buildProfile({ role: "SYSTEM_ADMIN" }));
    assert.equal(scope.includeAll, true);
    assert.equal(scope.saccoId, null);
  });

  it("respects explicit sacco filter for system admin", () => {
    const profile = buildProfile({ role: "SYSTEM_ADMIN" });
    const scope = resolveTenantScope(profile, { sacco: "sacco-123" });
    assert.equal(scope.includeAll, false);
    assert.equal(scope.saccoId, "sacco-123");
  });

  it("defaults to assigned sacco for tenant staff", () => {
    const profile = buildProfile({ role: "SACCO_MANAGER", sacco_id: "tenant-1" });
    const scope = resolveTenantScope(profile);
    assert.equal(scope.includeAll, false);
    assert.equal(scope.saccoId, "tenant-1");
  });

  it("ignores mismatched filters for tenant staff", () => {
    const profile = buildProfile({ role: "SACCO_MANAGER", sacco_id: "tenant-1" });
    const scope = resolveTenantScope(profile, { sacco: "other" });
    assert.equal(scope.includeAll, false);
    assert.equal(scope.saccoId, "tenant-1");
  });
});
