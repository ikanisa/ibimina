import { NextRequest, NextResponse } from "next/server";
import { guardAdminAction } from "@/lib/admin/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

type Params = {
  params: Promise<{ userId: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  const guard = await guardAdminAction<NextResponse>(
    {
      action: "admin_mfa_reset_user",
      reason: "Only system administrators can reset MFA for other users.",
      logEvent: "admin_mfa_reset_user_denied",
      clientFactory: createSupabaseAdminClient,
    },
    () => NextResponse.json({ error: "forbidden" }, { status: 403 }),
  );

  if (guard.denied) {
    return guard.result;
  }

  const { supabase, user: actor } = guard.context;

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "user_required" }, { status: 400 });
  }

  const reason = (await request.json().catch(() => ({} as { reason?: string }))).reason ?? "manual_reset";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from("users")
    .update({
      mfa_enabled: false,
      mfa_secret_enc: null,
      mfa_backup_hashes: [],
      mfa_enrolled_at: null,
      last_mfa_step: null,
      last_mfa_success_at: null,
      failed_mfa_count: 0,
    })
    .eq("id", userId);

  if (updateError) {
    console.error(updateError);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  const trustedResult = await supabase.from("trusted_devices").delete().eq("user_id", userId);
  if (trustedResult.error) {
    console.error("MFA reset: failed to delete trusted devices", trustedResult.error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  await logAudit({
    action: "MFA_RESET",
    entity: "USER",
    entityId: userId,
    diff: { actor: actor.id, reason },
  });

  return NextResponse.json({ success: true });
}
