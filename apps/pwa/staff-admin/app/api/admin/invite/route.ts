import { NextResponse } from "next/server";
import { createSupabaseServerClient, supabaseSrv } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { isSystemAdmin } from "@/lib/permissions";
import { logError } from "@/lib/observability/logger";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const service = supabaseSrv();
  const { data: profile, error: profileError } = await service
    .from("users")
    .select("id, role, sacco_id")
    .eq("id", user.id)
    .maybeSingle<Database["public"]["Tables"]["users"]["Row"]>();

  if (profileError || !profile || !isSystemAdmin(profile)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { email, role, org_type, org_id } = body as {
    email?: string;
    role?: Database["public"]["Enums"]["app_role"];
    org_type?: string | null;
    org_id?: string | null;
  };

  if (!email || !role) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const admin = (service as any).auth.admin;
  const inviteResult = await admin.inviteUserByEmail(email, {
    data: { role, org_type: org_type ?? null, org_id: org_id ?? null },
  });

  if (inviteResult.error) {
    logError("invite.send.error", {
      error: inviteResult.error.message,
      code: inviteResult.error.status,
    });
    return NextResponse.json({ error: inviteResult.error.message }, { status: 500 });
  }

  const invitedUserId = inviteResult.data?.user?.id;
  if (invitedUserId) {
    const updates: Partial<Database["public"]["Tables"]["users"]["Update"]> = {
      role,
      sacco_id: org_type === "SACCO" ? (org_id ?? null) : null,
    };
    const { error: updateError } = await service
      .from("users")
      .update(updates)
      .eq("id", invitedUserId);
    if (updateError) {
      logError("invite.update_profile.error", {
        error: updateError.message,
        code: updateError.code,
      });
    }
  }

  return NextResponse.json({ status: "ok", userId: invitedUserId ?? null });
}
