import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseServer";
import { canReconcilePayments, isSystemAdmin } from "@/lib/permissions";

const payloadSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  ikiminaId: z.string().uuid().optional(),
  memberId: z.string().uuid().nullable().optional(),
  saccoId: z.string().uuid().nullish(),
});

export async function POST(request: NextRequest) {
  const auth = await requireUserAndProfile();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { ids, ikiminaId, memberId, saccoId } = parsed.data;
  if (!ikiminaId) {
    return NextResponse.json({ error: "ikiminaId is required" }, { status: 400 });
  }

  const userProfile = auth.profile;
  const supabase = createSupabaseServiceRoleClient("admin/payments/assign");

  const saccoScope = saccoId ?? userProfile.sacco_id ?? null;
  if (!isSystemAdmin(userProfile)) {
    if (!saccoScope || !canReconcilePayments(userProfile, saccoScope)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { data: ikiminaRow, error: ikiminaError } = await supabase
    .schema("app")
    .from("ikimina")
    .select("id, sacco_id")
    .eq("id", ikiminaId)
    .maybeSingle();

  if (ikiminaError || !ikiminaRow) {
    return NextResponse.json({ error: ikiminaError?.message ?? "Ikimina not found" }, { status: 404 });
  }

  if (!isSystemAdmin(userProfile) && ikiminaRow.sacco_id !== userProfile.sacco_id) {
    return NextResponse.json({ error: "Ikimina belongs to a different SACCO" }, { status: 403 });
  }

  const updatePayload: Record<string, unknown> = { ikimina_id: ikiminaId };
  if (memberId !== undefined) {
    updatePayload.member_id = memberId;
  }

  let query = supabase
    .schema("app")
    .from("payments")
    .update(updatePayload)
    .in("id", ids)
    .select("id");

  if (!isSystemAdmin(userProfile)) {
    if (!userProfile.sacco_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    query = query.eq("sacco_id", userProfile.sacco_id);
  } else if (saccoId) {
    query = query.eq("sacco_id", saccoId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message ?? "Failed to assign payments" }, { status: 500 });
  }

  return NextResponse.json({ updated: data?.length ?? 0 });
}
