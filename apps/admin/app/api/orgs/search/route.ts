import { NextResponse } from "next/server";
import { supabaseSrv } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") ?? "").toUpperCase();
  const q = (searchParams.get("q") ?? "").trim();

  if (!type || !["MFI", "DISTRICT"].includes(type)) {
    return NextResponse.json({ error: "Invalid or missing type" }, { status: 400 });
  }

  const supabase = supabaseSrv();
  const orgType = type as unknown as Database["app"]["Enums"]["org_type"];

  let query: any = supabase
    .schema("app")
    .from("organizations")
    .select("id, name, type, district_code")
    .eq("type", orgType);
  if (q) {
    query = query.ilike("name", `%${q}%`);
  }
  const { data, error } = await query.limit(20);
  if (error) {
    return NextResponse.json({ error: error.message ?? "Search failed" }, { status: 500 });
  }
  return NextResponse.json({
    organizations: (data ?? []).map((o) => ({
      id: o.id as string,
      name: o.name as string,
      district_code: (o as any).district_code ?? null,
    })),
  });
}
