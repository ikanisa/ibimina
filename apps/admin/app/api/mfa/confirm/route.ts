import { NextRequest, NextResponse } from "next/server";
import { requireUserAndProfile } from "@/lib/auth";
import {
  decodePendingEnrollment,
  encryptSensitiveString,
  generateBackupCodes,
  verifyTotp,
} from "@/lib/mfa";
import { logAudit } from "@/lib/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

const MAX_PENDING_AGE_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  const { user, profile } = await requireUserAndProfile();
  if (profile.mfa_enabled) {
    return NextResponse.json({ error: "already_enabled" }, { status: 400 });
  }

  const { token, codes } = await request.json();
  if (!token || !Array.isArray(codes) || codes.length < 2) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  let payload: { userId: string; secret: string; issuedAt: number };
  try {
    payload = decodePendingEnrollment(token);
  } catch {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  if (payload.userId !== user.id) {
    return NextResponse.json({ error: "token_user_mismatch" }, { status: 400 });
  }

  if (Date.now() - payload.issuedAt > MAX_PENDING_AGE_MS) {
    return NextResponse.json({ error: "token_expired" }, { status: 400 });
  }

  const [codeA, codeB] = codes.map((value: string) => value.trim());
  const firstVerification = verifyTotp(payload.secret, codeA, 1);
  const secondVerification = verifyTotp(payload.secret, codeB, 1);

  if (!firstVerification.ok || !secondVerification.ok || codeA === codeB) {
    return NextResponse.json({ error: "invalid_codes" }, { status: 422 });
  }

  const encryptedSecret = encryptSensitiveString(payload.secret);
  const backupRecords = generateBackupCodes();
  const supabase = createSupabaseAdminClient();

  const methodSet = new Set<string>(profile.mfa_methods ?? []);
  methodSet.add("TOTP");

  const updatePayload: Database["public"]["Tables"]["users"]["Update"] = {
    mfa_enabled: true,
    mfa_secret_enc: encryptedSecret,
    mfa_enrolled_at: new Date().toISOString(),
    mfa_backup_hashes: backupRecords.map((record) => record.hash),
    mfa_methods: Array.from(methodSet),
    failed_mfa_count: 0,
    last_mfa_step: null,
    last_mfa_success_at: null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from("users")
    .update(updatePayload)
    .eq("id", user.id);

  if (updateError) {
    console.error(updateError);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  await logAudit({
    action: "MFA_ENROLLED",
    entity: "USER",
    entityId: user.id,
    diff: { methods: Array.from(methodSet) },
  });

  return NextResponse.json({ backupCodes: backupRecords.map((record) => record.code) });
}
