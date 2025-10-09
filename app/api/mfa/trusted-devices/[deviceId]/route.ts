import { NextResponse } from "next/server";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

type Params = {
  params: Promise<{ deviceId: string }>;
};

export async function DELETE(_: Request, { params }: Params) {
  const { user } = await requireUserAndProfile();
  const { deviceId } = await params;
  if (!deviceId) {
    return NextResponse.json({ error: "device_required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("trusted_devices").delete().eq("user_id", user.id).eq("device_id", deviceId);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  await logAudit({ action: "MFA_TRUSTED_DEVICE_REVOKE", entity: "USER", entityId: user.id, diff: { deviceId } });

  return NextResponse.json({ success: true });
}
