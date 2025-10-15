import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const supabase = createSupabaseAdminClient();
  const rpcArgs: Database["public"]["Functions"]["search_saccos"]["Args"] = {
    query: q,
    limit_count: 10,
  };

  const { data, error } = await (supabase as any).rpc("search_saccos", rpcArgs);

  if (error) {
    console.error("Failed to search SACCOs", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }

  const rows = (data ?? []) as Database["public"]["Functions"]["search_saccos"]["Returns"];

  const results = rows.map((row) => ({
    id: row.id,
    name: row.name,
    district: row.district,
    sector_code: row.sector,
  }));

  return NextResponse.json({ results });
}
