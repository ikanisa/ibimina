import { NextRequest, NextResponse } from "next/server";
import { requireUserAndProfile } from "@/lib/auth";
import {
  createOtpAuthUri,
  encodePendingEnrollment,
  generateTotpSecret,
  previewSecret,
  decryptSensitiveString,
  verifyTotp,
  consumeBackupCode,
} from "@/lib/mfa";
import { logAudit } from "@/lib/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

export async function POST() {
  const { user, profile } = await requireUserAndProfile();

  if (profile.mfa_enabled) {
    return NextResponse.json({ error: "already_enabled" }, { status: 400 });
  }

  const secret = generateTotpSecret();
  const issuer = "SACCO+";
  const account = user.email ?? user.user_metadata?.email ?? user.id;
  const otpauth = createOtpAuthUri(issuer, account, secret);
  const pendingToken = encodePendingEnrollment({ userId: user.id, secret, issuedAt: Date.now() });

  await logAudit({ action: "MFA_ENROLLMENT_STARTED", entity: "USER", entityId: user.id, diff: null });

  return NextResponse.json({ otpauth, secret, secretPreview: previewSecret(secret, 6), pendingToken });
}

export async function DELETE(request: NextRequest) {
  const { user, profile } = await requireUserAndProfile();
  if (!profile.mfa_enabled) {
    return NextResponse.json({ error: "not_enabled" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { token, method } = await request.json().catch(() => ({ token: undefined, method: "totp" }));

  if (!token) {
    return NextResponse.json({ error: "token_required" }, { status: 400 });
  }

  const { data: rawRecord, error } = await supabase
    .from("users")
    .select("mfa_secret_enc, mfa_backup_hashes, mfa_methods, mfa_passkey_enrolled, mfa_enabled, mfa_enrolled_at")
    .eq("id", user.id)
    .maybeSingle();

  const record = rawRecord as Pick<
    Database["public"]["Tables"]["users"]["Row"],
    "mfa_secret_enc" | "mfa_backup_hashes" | "mfa_methods" | "mfa_passkey_enrolled" | "mfa_enabled" | "mfa_enrolled_at"
  > | null;

  if (error || !record?.mfa_secret_enc) {
    console.error(error);
    return NextResponse.json({ error: "mfa_not_configured" }, { status: 400 });
  }

  let verified = false;
  let updatedBackupHashes = record.mfa_backup_hashes ?? [];

  if (method === "backup") {
    const next = consumeBackupCode(token, updatedBackupHashes);
    if (next) {
      verified = true;
      updatedBackupHashes = next;
    }
  } else {
    try {
      const secret = decryptSensitiveString(record.mfa_secret_enc);
      const verification = verifyTotp(secret, token, 1);
      verified = verification.ok;
    } catch (e) {
      // If decryption fails (mismatched KMS_DATA_KEY), return invalid_code instead of 500
      console.error("MFA disable: decrypt failed", (e as Error)?.message ?? e);
      return NextResponse.json({ error: "configuration_error" }, { status: 500 });
    }
  }

  if (!verified) {
    await logAudit({ action: "MFA_DISABLE_FAILED", entity: "USER", entityId: user.id, diff: null });
    return NextResponse.json({ error: "invalid_code" }, { status: 401 });
  }

  const remainingMethods = new Set<string>(record.mfa_methods ?? profile.mfa_methods ?? []);
  remainingMethods.delete("TOTP");
  const remainingList = Array.from(remainingMethods);
  const stillProtected = remainingList.length > 0;

  const updatePayload: Database["public"]["Tables"]["users"]["Update"] = {
    mfa_enabled: stillProtected,
    mfa_secret_enc: null,
    mfa_enrolled_at: stillProtected ? record.mfa_enrolled_at ?? new Date().toISOString() : null,
    mfa_backup_hashes: [],
    mfa_methods: remainingList,
    failed_mfa_count: 0,
    last_mfa_step: null,
    last_mfa_success_at: null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any).from("users").update(updatePayload).eq("id", user.id);

  if (updateError) {
    console.error(updateError);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  const trustedResult = await supabase.from("trusted_devices").delete().eq("user_id", user.id);
  if (trustedResult.error) {
    console.error("MFA disable: failed to delete trusted devices", trustedResult.error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  await logAudit({
    action: stillProtected ? "MFA_METHOD_REMOVED" : "MFA_DISABLED",
    entity: "USER",
    entityId: user.id,
    diff: { removed: "TOTP", remaining: remainingList },
  });

  const response = NextResponse.json({ success: true });
  response.cookies.delete("ibimina_mfa");
  response.cookies.delete("ibimina_trusted");
  return response;
}
