import { NextRequest, NextResponse } from "next/server";
import { supabaseSrv } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const srv = supabaseSrv();

  const client = srv as any;
  const {
    data: { user },
    error: authError,
  } = await srv.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const gid = ctx.params.id;
  const { data, error } = await client
    .from("members")
    .select("id, full_name, msisdn, member_code, status, joined_at")
    .eq("ikimina_id", gid)
    .order("joined_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ members: data ?? [] });
}
