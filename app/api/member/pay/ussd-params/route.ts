import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("group_id");

  if (!groupId) {
    return NextResponse.json({ error: "Missing group id" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: group, error: groupError } = await supabase
    .from("ibimina")
    .select("id, code, name, sacco_id")
    .eq("id", groupId)
    .maybeSingle();

  if (groupError) {
    console.error("Failed to load group", groupError);
    return NextResponse.json({ error: "Unable to load group" }, { status: 500 });
  }

  const groupRow = (group ?? null) as Pick<Database["public"]["Tables"]["ibimina"]["Row"], "id" | "code" | "name" | "sacco_id"> | null;

  if (!groupRow) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const { data: sacco, error: saccoError } = await supabase
    .from("saccos")
    .select("name, district, sector_code")
    .eq("id", groupRow.sacco_id)
    .maybeSingle();

  if (saccoError) {
    console.error("Failed to load sacco", saccoError);
    return NextResponse.json({ error: "Unable to load SACCO" }, { status: 500 });
  }

  const saccoRow = (sacco ?? null) as Pick<Database["public"]["Tables"]["saccos"]["Row"], "name" | "district" | "sector_code"> | null;

  const merchant = saccoRow?.sector_code ?? "182000";
  const district = saccoRow?.district?.toUpperCase().replace(/\s+/g, "-") ?? "DISTRICT";
  const saccoSlug = saccoRow?.name?.split(" ")[0]?.toUpperCase() ?? "SACCO";
  const reference = `${district}.${saccoSlug}.${groupRow.code}`;

  return NextResponse.json({
    merchant,
    reference,
    telUri: "tel:*182#",
  });
}
