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
    .from("payments")
    .select("id, amount, currency, occurred_at, status, ikimina_id")
    .eq("user_id", user.id)
    .order("occurred_at", { ascending: false })
    .limit(10);

  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json({ activity: [] });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ activity: data ?? [] });
}
