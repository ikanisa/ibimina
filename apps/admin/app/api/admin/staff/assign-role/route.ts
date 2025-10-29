import { NextResponse } from "next/server";
import { guardAdminAction } from "@/lib/admin/guard";
import type { Database } from "@/lib/supabase/types";
import { supabaseSrv } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const {
    user_id: userId,
    role,
    sacco_id: saccoId,
    org_id: orgId,
  } = (await request.json().catch(() => ({}))) as {
    user_id?: string;
    role?: Database["public"]["Enums"]["app_role"];
    sacco_id?: string | null;
    org_id?: string | null;
  };

  if (!userId || !role) {
    return NextResponse.json({ error: "user_id and role are required" }, { status: 400 });
  }

  const guard = await guardAdminAction(
    {
      action: "admin_staff_assign_role",
      reason: "Only system administrators can update roles.",
      logEvent: "admin_staff_assign_role_denied",
      metadata: { targetUserId: userId },
    },
    (error) => NextResponse.json({ error: error.message }, { status: 403 })
  );
  if (guard.denied) return guard.result;

  const supabase = supabaseSrv();

  const isSaccoRole = role === "SACCO_MANAGER" || role === "SACCO_STAFF" || role === "SACCO_VIEWER";
  const isDistrictRole = role === "DISTRICT_MANAGER";
  const isMfiRole = role === "MFI_MANAGER" || role === "MFI_STAFF";

  // Validate required org and types
  if (isSaccoRole && !saccoId) {
    return NextResponse.json({ error: "sacco_id is required for SACCO roles" }, { status: 400 });
  }
  let resolvedOrgId: string | null = null;
  if (!isSaccoRole && (isDistrictRole || isMfiRole)) {
    if (!orgId) return NextResponse.json({ error: "org_id is required" }, { status: 400 });

    const { data: org, error: orgError } = await (supabase as any)
      .schema("app")
      .from("organizations")
      .select("id, type")
      .eq("id", orgId)
      .maybeSingle();
    if (orgError)
      return NextResponse.json({ error: orgError.message ?? "Lookup failed" }, { status: 500 });
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    if (isDistrictRole && org.type !== "DISTRICT")
      return NextResponse.json({ error: "Role/org mismatch" }, { status: 400 });
    if (isMfiRole && org.type !== "MFI")
      return NextResponse.json({ error: "Role/org mismatch" }, { status: 400 });
    resolvedOrgId = org.id as string;
  }

  // Phase 1: update users table directly

  const { error } = await (supabase as any)
    .from("users")
    .update({ role, sacco_id: isSaccoRole ? (saccoId ?? null) : null })
    .eq("id", userId);
  if (error) {
    return NextResponse.json({ error: error.message ?? "Failed to update role" }, { status: 500 });
  }

  // Phase 2: reflect in org_memberships
  try {
    if (isSaccoRole && saccoId) {
      await (supabase as any)
        .schema("app")
        .from("org_memberships")
        .upsert({ user_id: userId, org_id: saccoId, role }, { onConflict: "user_id,org_id" });
    }
    if (!isSaccoRole && resolvedOrgId) {
      await (supabase as any)
        .schema("app")
        .from("org_memberships")
        .upsert({ user_id: userId, org_id: resolvedOrgId, role }, { onConflict: "user_id,org_id" });
    }
  } catch (e) {
    if (!(e && typeof e === "object" && (e as any).code)) {
      console.warn("org_memberships upsert failed", e);
    }
  }

  return NextResponse.json({ ok: true });
}
