import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export async function GET(request: NextRequest) {
  const groupId = request.nextUrl.searchParams.get("group_id");

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
    .schema("app")
    .from("ikimina")
    .select("id, code, name, sacco_id")
    .eq("id", groupId)
    .maybeSingle();

  if (groupError) {
    console.error("Failed to load group", groupError);
    return NextResponse.json({ error: "Unable to load group" }, { status: 500 });
  }

  const groupRow = (group ?? null) as Pick<
    Database["app"]["Tables"]["ikimina"]["Row"],
    "id" | "code" | "name" | "sacco_id"
  > | null;

  if (!groupRow) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const { data: sacco, error: saccoError } = await supabase
    .schema("app")
    .from("saccos")
    .select("name, district, sector_code")
    .eq("id", groupRow.sacco_id)
    .maybeSingle();

  if (saccoError) {
    console.error("Failed to load sacco", saccoError);
    return NextResponse.json({ error: "Unable to load SACCO" }, { status: 500 });
  }

  const saccoRow = (sacco ?? null) as Pick<
    Database["app"]["Tables"]["saccos"]["Row"],
    "name" | "district" | "sector_code"
  > | null;

  const districtRaw = saccoRow?.district ?? null;
  const districtKey = districtRaw?.trim().toUpperCase() ?? null;

  let merchant = saccoRow?.sector_code ?? "182000";
  let provider = "MTN";
  let accountName = saccoRow?.name ?? null;

  if (districtKey) {
    const { data: momoCode, error: momoError } = await supabase
      .schema("app")
      .from("momo_codes")
      .select("code, provider, account_name")
      .eq("provider", provider)
      .eq("district", districtKey)
      .maybeSingle();

    if (momoError && momoError.code !== "PGRST116") {
      console.error("Failed to load MoMo code", momoError);
    }

    if (momoCode?.code) {
      merchant = momoCode.code;
      provider = momoCode.provider ?? provider;
      accountName = momoCode.account_name ?? accountName;
    }
  }

  const districtSlug = districtKey?.replace(/\s+/g, "-") ?? "DISTRICT";
  const saccoSlug = saccoRow?.name?.split(" ")[0]?.toUpperCase() ?? "SACCO";
  const reference = `${districtSlug}.${saccoSlug}.${groupRow.code}`;

  return NextResponse.json(
    {
      merchant,
      provider,
      account_name: accountName,
      reference,
      telUri: "tel:*182#",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=120, stale-while-revalidate=300",
      },
    }
  );
}
