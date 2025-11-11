import { NextRequest, NextResponse } from "next/server";
import { supabaseSrv } from "@/lib/supabase/server";
import { AddSaccoReq } from "@/lib/validators";

export async function POST(req: NextRequest) {
  const srv = supabaseSrv();

  const client = srv as any;
  const {
    data: { user },
    error: authError,
  } = await srv.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = AddSaccoReq.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { sacco_id } = parsed.data;

  const { error } = await client.from("user_saccos").upsert({ user_id: user.id, sacco_id });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
