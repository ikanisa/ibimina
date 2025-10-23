import { NextResponse } from "next/server";
import { supabaseSrv } from "@/lib/supabase/server";

export async function GET() {
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

  const { data, error } = await client
    .from("members")
    .select("ikimina_id, ikimina(name, sacco_id), member_code, status")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ groups: data ?? [] });
}
