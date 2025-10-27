import { NextResponse } from "next/server";
import { guardAdminAction } from "@/lib/admin/guard";
import { supabaseSrv } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const { user_id: userId, suspended } = (await request.json().catch(() => ({}))) as {
    user_id?: string;
    suspended?: boolean;
  };

  if (!userId || typeof suspended !== "boolean") {
    return NextResponse.json({ error: "user_id and suspended are required" }, { status: 400 });
  }

  const guard = await guardAdminAction(
    {
      action: "admin_staff_suspend_toggle",
      reason: "Only system administrators can suspend staff.",
      logEvent: "admin_staff_suspend_toggle_denied",
      metadata: { targetUserId: userId },
    },
    (error) => NextResponse.json({ error: error.message }, { status: 403 }),
  );
  if (guard.denied) return guard.result;

  const supabase = supabaseSrv();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("users").update({ suspended }).eq("id", userId);
  if (error) {
    return NextResponse.json({ error: error.message ?? "Failed to update" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, suspended });
}

