import { NextResponse } from "next/server";
import { guardAdminAction } from "@/lib/admin/guard";
import { supabaseSrv } from "@/lib/supabase/server";
import { isMissingRelationError } from "@/lib/supabase/errors";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const saccoId = searchParams.get("sacco_id");
  const status = searchParams.get("status"); // "active" | "suspended"
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const orgTypeParam = (searchParams.get("org_type") ?? "").toUpperCase();
  const orgId = searchParams.get("org_id");
  if (orgTypeParam && !["MFI", "DISTRICT"].includes(orgTypeParam)) {
    return NextResponse.json({ error: "Invalid org_type" }, { status: 400 });
  }

  const guard = await guardAdminAction(
    {
      action: "admin_staff_list",
      reason: "Only system administrators can list staff.",
      logEvent: "admin_staff_list_denied",
    },
    (error) => NextResponse.json({ error: error.message }, { status: 403 })
  );

  if (guard.denied) return guard.result;

  const supabase = supabaseSrv();

  let scopedUserIds: string[] | null = null;
  if (orgTypeParam) {
    let membershipQuery: any = supabase
      .schema("app")
      .from("org_memberships")
      .select("user_id, org_id, organizations(type)");
    membershipQuery = membershipQuery.eq("organizations.type", orgTypeParam);
    if (orgId) {
      membershipQuery = membershipQuery.eq("org_id", orgId);
    }
    const membershipResult = await membershipQuery;
    if (membershipResult.error && !isMissingRelationError(membershipResult.error)) {
      return NextResponse.json(
        { error: membershipResult.error.message ?? "Failed to load memberships" },
        { status: 500 }
      );
    }
    const rows = (membershipResult.data ?? []) as Array<{ user_id: string | null }>;
    const ids = Array.from(
      new Set(
        rows
          .map((row) => row.user_id)
          .filter((value): value is string => typeof value === "string" && value.length > 0)
      )
    );
    if (ids.length === 0) {
      return NextResponse.json({ users: [] });
    }
    scopedUserIds = ids;
  }

  let query: any = supabase
    .from("users")
    .select("id, email, role, sacco_id, created_at, suspended, saccos: saccos(name)");

  if (role) query = query.eq("role", role);
  if (saccoId) query = query.eq("sacco_id", saccoId);
  if (status === "active") query = query.eq("suspended", false);
  if (status === "suspended") query = query.eq("suspended", true);
  if (scopedUserIds) query = query.in("id", scopedUserIds);

  query = query.order("created_at", { ascending: false });

  const result = await query;
  if (result.error && !isMissingRelationError(result.error)) {
    return NextResponse.json(
      { error: result.error.message ?? "Failed to load staff" },
      { status: 500 }
    );
  }

  let rows = (result.data ?? []) as Array<{
    id: string;
    email: string;
    role: string;
    sacco_id: string | null;
    created_at: string | null;
    suspended?: boolean | null;
    saccos?: { name: string | null } | null;
  }>;
  if (q) {
    rows = rows.filter((r) => (r.email ?? "").toLowerCase().includes(q));
  }

  const users = rows.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    sacco_id: u.sacco_id,
    sacco_name: u.saccos?.name ?? null,
    created_at: u.created_at,
    suspended: Boolean(u.suspended),
  }));

  return NextResponse.json({ users });
}
