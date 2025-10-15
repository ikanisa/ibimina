import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const bodySchema = z.object({
  saccoId: z.string().uuid("Invalid SACCO"),
});

interface RouteContext {
  params: { id: string };
}

export async function POST(request: NextRequest | Request, { params }: RouteContext) {
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

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const groupId = params.id;
  const saccoId = parsed.data.saccoId;

  // Load group and verify sacco match
  const {
    data: group,
    error: groupError,
  } = await supabase
    .from("ibimina")
    .select("sacco_id")
    .eq("id", groupId)
    .maybeSingle();

  if (groupError) {
    console.error("Failed to load group", groupError);
    return NextResponse.json({ error: "Unable to create request" }, { status: 500 });
  }

  type GroupRow = Pick<Database["public"]["Tables"]["ibimina"]["Row"], "sacco_id">;
  const groupRecord = group as GroupRow | null;

  if (!groupRecord || groupRecord.sacco_id !== saccoId) {
    return NextResponse.json({ error: "Group mismatch" }, { status: 400 });
  }

  // Ensure the user is linked to the SACCO
  const { data: membership } = await supabase
    .from("user_saccos")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("sacco_id", saccoId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "SACCO not linked" }, { status: 400 });
  }

  // If a request already exists, return its status
  const {
    data: existing,
    error: existingError,
  } = await supabase
    .from("join_requests")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("group_id", groupId)
    .maybeSingle();

  if (existingError) {
    console.error("Failed to load existing join request", existingError);
    return NextResponse.json({ error: "Unable to create request" }, { status: 500 });
  }

  type JoinRequestPreview = Pick<Database["public"]["Tables"]["join_requests"]["Row"], "id" | "status">;
  const existingRequest = existing as JoinRequestPreview | null;

  if (existingRequest) {
    return NextResponse.json({ ok: true, status: existingRequest.status });
  }

  // Create new join request
  const insertPayload: Database["public"]["Tables"]["join_requests"]["Insert"] = {
    user_id: user.id,
    group_id: groupId,
    sacco_id: saccoId,
  };

  const joinRequestsClient = supabase.from("join_requests");
  const insertJoinRequest = joinRequestsClient.insert.bind(joinRequestsClient) as unknown as (
    values: Database["public"]["Tables"]["join_requests"]["Insert"],
  ) => Promise<{ error: unknown }>;

  const { error } = await insertJoinRequest(insertPayload);

  if (error) {
    console.error("Failed to create join request", error);
    return NextResponse.json({ error: "Unable to create request" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: "pending" });
}
