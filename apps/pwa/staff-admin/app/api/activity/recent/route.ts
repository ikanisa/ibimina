import { NextResponse } from "next/server";
import { supabaseSrv } from "@/lib/supabase/server";

export async function GET() {
  const srv = supabaseSrv();

  const legacyClient = srv as any;
  const {
    data: { user },
    error: authError,
  } = await srv.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { data, error } = await legacyClient
    .from("join_requests")
    .select("id, group_id, sacco_id, status, created_at, note")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json({ activity: [] });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { activity: data ?? [] },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=180",
      },
    }
  );
}
