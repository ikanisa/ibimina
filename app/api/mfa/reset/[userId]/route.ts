import { NextResponse } from "next/server";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

type Params = {
  params: Promise<{ userId: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const { user: actor, profile } = await requireUserAndProfile();
  if (profile.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "user_required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
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

  await supabase.from("trusted_devices").delete().eq("user_id", userId);

  await logAudit({
    action: "MFA_RESET",
    entity: "USER",
    entityId: userId,
    diff: { actor: actor.id, reason },
  });

  return NextResponse.json({ success: true });
}
