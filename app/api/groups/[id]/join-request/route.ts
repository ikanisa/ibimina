import { NextResponse } from "next/server";
import { supabaseSrv } from "@/lib/supabase/server";
import { JoinRequestReq } from "@/lib/validators";

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const srv = supabaseSrv();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Extend Supabase types to cover client app tables.
  const client = srv as any;
  const {
    data: { user },
    error: authError,
  } = await srv.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const gid = ctx.params.id;
  const body = await req.json();
  const parsed = JoinRequestReq.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: group, error: groupError } = await client
    .from("ikimina")
    .select("id, sacco_id")
    .eq("id", gid)
    .maybeSingle();

  if (groupError) {
    return NextResponse.json({ error: groupError.message }, { status: 500 });
  }

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const { error } = await client.from("join_requests").insert({
    user_id: user.id,
    sacco_id: group.sacco_id,
    group_id: gid,
    note: parsed.data.note ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
