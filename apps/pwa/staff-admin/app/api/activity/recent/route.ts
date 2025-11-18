import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("join_requests")
    .select("id, group_id, sacco_id, status, created_at, note")
    .eq("user_id", session.user.id)
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
