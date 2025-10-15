import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const bodySchema = z.object({
  saccoId: z.string().uuid("Invalid SACCO"),
});

interface RouteContext {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteContext) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("Auth error", authError);
    return NextResponse.json({ error: "Auth error" }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const groupId = params.id;
  const saccoId = parsed.data.saccoId;

  const { data: group, error: groupError } = await supabase
    .from("ibimina")
    .select("sacco_id")
    .eq("id", groupId)
    .maybeSingle();

  if (groupError) {
    console.error("Failed to load group", groupError);
    return NextResponse.json({ error: "Unable to create request" }, { status: 500 });
  }

  const groupRow = (group ?? null) as Pick<Database["public"]["Tables"]["ibimina"]["Row"], "sacco_id"> | null;

  if (!groupRow || groupRow.sacco_id !== saccoId) {
    return NextResponse.json({ error: "Group mismatch" }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from("user_saccos")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("sacco_id", saccoId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "SACCO not linked" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("join_requests")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("group_id", groupId)
    .maybeSingle();

  const existingRow = (existing ?? null) as Pick<Database["public"]["Tables"]["join_requests"]["Row"], "id" | "status"> | null;

  if (existingRow) {
    return NextResponse.json({ ok: true, status: existingRow.status });
  }

  const insertPayload: Database["public"]["Tables"]["join_requests"]["Insert"] = {
    user_id: user.id,
    group_id: groupId,
    sacco_id: saccoId,
  };

  const { error } = await supabase.from("join_requests").insert(insertPayload);

  if (error) {
    console.error("Failed to create join request", error);
    return NextResponse.json({ error: "Unable to create request" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: "pending" });
}
