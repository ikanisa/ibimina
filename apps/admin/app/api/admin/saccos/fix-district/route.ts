import { NextResponse } from "next/server";
import { guardAdminAction } from "@/lib/admin/guard";
import { supabaseSrv } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const { sacco_id: saccoId } = (await request.json().catch(() => ({}))) as { sacco_id?: string };
  if (!saccoId) return NextResponse.json({ error: "sacco_id is required" }, { status: 400 });

  const guard = await guardAdminAction(
    {
      action: "admin_fix_sacco_district",
      reason: "Only administrators can modify SACCO registry.",
      logEvent: "admin_fix_sacco_district_denied",
    },
    (error) => NextResponse.json({ error: error.message }, { status: 403 })
  );
  if (guard.denied) return guard.result;

  const supabase = supabaseSrv();
  // Fetch sacco

  const current = await (supabase as any)
    .schema("app")
    .from("saccos")
    .select("id, district, district_org_id")
    .eq("id", saccoId)
    .maybeSingle();
  if (current.error)
    return NextResponse.json({ error: current.error.message ?? "Lookup failed" }, { status: 500 });
  const row = current.data as {
    id: string;
    district?: string | null;
    district_org_id?: string | null;
  } | null;
  if (!row) return NextResponse.json({ error: "SACCO not found" }, { status: 404 });
  if (row.district_org_id) return NextResponse.json({ ok: true, message: "Already set" });
  const districtName = (row.district ?? "").trim();
  if (!districtName)
    return NextResponse.json({ error: "No district name to match" }, { status: 400 });

  // Attempt match by name (case-insensitive)

  const match = await (supabase as any)
    .schema("app")
    .from("organizations")
    .select("id, name")
    .eq("type", "DISTRICT")
    .ilike("name", districtName)
    .maybeSingle();
  if (match.error)
    return NextResponse.json({ error: match.error.message ?? "Match failed" }, { status: 500 });
  const org = match.data as { id: string } | null;
  if (!org)
    return NextResponse.json({ error: "No matching District organization found" }, { status: 404 });

  // Update saccos

  const update = await (supabase as any)
    .schema("app")
    .from("saccos")
    .update({ district_org_id: org.id })
    .eq("id", saccoId);
  if (update.error)
    return NextResponse.json({ error: update.error.message ?? "Update failed" }, { status: 500 });
  return NextResponse.json({ ok: true, district_org_id: org.id });
}
