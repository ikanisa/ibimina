import { NextResponse } from "next/server";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

type ResetPayload = {
  userId?: string;
  email?: string;
  reason: string;
};

export async function POST(request: Request) {
  const { user, profile } = await requireUserAndProfile();
  if (profile.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as ResetPayload | null;
  if (!body || (!body.userId && !body.email) || !body.reason) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Locate target user by id or email
  const query = supabase
    .from("users")
    .select("id, email, mfa_enabled, mfa_secret_enc")
    .limit(1);

  const { data: foundById } = body.userId
    ? await query.eq("id", body.userId)
    : { data: null };

  const { data: foundByEmail } = !foundById?.[0] && body.email
    ? await supabase.from("users").select("id, email, mfa_enabled, mfa_secret_enc").eq("email", body.email).limit(1)
    : { data: null };

  const target = (foundById ?? foundByEmail)?.[0] ?? null;
  if (!target) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  // Reset MFA flags and clear trusted devices
  const updatePayload = {
    mfa_enabled: false,
    mfa_secret_enc: null,
    mfa_enrolled_at: null,
    mfa_backup_hashes: [],
    mfa_methods: ["TOTP"],
    failed_mfa_count: 0,
    last_mfa_step: null,
    last_mfa_success_at: null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from("users")
    .update(updatePayload)
    .eq("id", target.id);

  if (updateError) {
    console.error("admin mfa reset: update failed", updateError);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  const trustedDelete = await supabase.from("trusted_devices").delete().eq("user_id", target.id);
  if (trustedDelete.error) {
    console.error("admin mfa reset: trusted devices delete failed", trustedDelete.error);
    return NextResponse.json({ error: "trusted_cleanup_failed" }, { status: 500 });
  }

  await logAudit({
    action: "MFA_RESET",
    entity: "USER",
    entityId: target.id,
    diff: { reason: body.reason, actor: user.id },
  });

  return NextResponse.json({ success: true, userId: target.id });
}

