import { NextRequest, NextResponse } from "next/server";
import { supabaseSrv } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const srv = supabaseSrv();

  const client = srv as any;
  const {
    data: { user },
    error: authError,
  } = await srv.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const q = (req.nextUrl.searchParams.get("q") || "").trim();

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const { data, error } = await client.rpc("search_saccos_trgm", { q });

  if (!error) {
    return NextResponse.json({ results: data ?? [] });
  }

  const sanitized = q.replace(/[,%]/g, "").replace(/[\n\r]/g, " ");
  const pattern = `%${sanitized.replace(/[%_]/g, "\\$&")}%`;

  const { data: fallbackData, error: fallbackError } = await client
    .schema("app")
    .from("saccos")
    .select("id, name, district, sector_code")
    .or(`name.ilike.${pattern},sector_code.ilike.${pattern}`)
    .order("name", { ascending: true })
    .limit(20);

  if (fallbackError) {
    return NextResponse.json({ error: fallbackError.message }, { status: 500 });
  }

  return NextResponse.json({ results: fallbackData ?? [] });
}
