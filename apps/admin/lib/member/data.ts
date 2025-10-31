import { cache } from "react";
import { createSupabaseServerClient, supabaseSrv } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export interface MemberProfileRow {
  user_id: string;
  whatsapp_msisdn: string;
  momo_msisdn: string;
  id_type: string | null;
  id_number: string | null;
  id_files: Record<string, unknown> | null;
  ocr_json: Record<string, unknown> | null;
  lang: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type MemberSaccoRow = Database["app"]["Tables"]["saccos"]["Row"];
export type MemberGroupRow = Database["app"]["Tables"]["ikimina"]["Row"];
export interface MemberJoinRequestRow {
  id: string;
  user_id: string;
  sacco_id: string;
  group_id: string;
  status: string;
  created_at: string | null;
  note?: string | null;
}
export type MemberSaccoSummary = Pick<
  MemberSaccoRow,
  "id" | "name" | "district" | "sector_code" | "province" | "category"
>;

interface MemberHomeData {
  profile: MemberProfileRow | null;
  saccos: MemberSaccoRow[];
  groups: MemberGroupRow[];
  joinRequests: MemberJoinRequestRow[];
}

export const getMemberHomeData = cache(async (): Promise<MemberHomeData> => {
  const supabase = await createSupabaseServerClient();
  const appSupabase = supabaseSrv();
  // Member application tables are optional snapshots; fall back to untyped client access

  const legacyClient = supabase as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { profile: null, saccos: [], groups: [], joinRequests: [] };
  }

  const [{ data: profile, error: profileError }, { data: linkedSaccos, error: linkedError }] =
    await Promise.all([
      legacyClient.from("members_app_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      legacyClient.from("user_saccos").select("sacco_id, created_at").eq("user_id", user.id),
    ]);

  if (profileError) {
    console.error("Failed to load member profile", profileError);
    throw new Error("Unable to load member profile");
  }
  if (linkedError) {
    console.error("Failed to load linked SACCOs", linkedError);
    throw new Error("Unable to load SACCO list");
  }

  const profileRow = profile ? (profile as MemberProfileRow) : null;
  const linked = Array.isArray(linkedSaccos) ? (linkedSaccos as Array<{ sacco_id: string }>) : [];
  const saccoIds = linked.map((entry) => entry.sacco_id).filter(Boolean);

  let saccoRows: MemberSaccoRow[] = [];
  if (saccoIds.length > 0) {
    const { data: saccos, error: saccoError } = await appSupabase
      .from("saccos")
      .select("id, name, district, sector_code, province, category, status")
      .in("id", saccoIds)
      .order("name", { ascending: true });

    if (saccoError) {
      console.error("Failed to load member SACCOs", saccoError);
      throw new Error("Unable to load SACCO list");
    }

    saccoRows = (saccos ?? []) as MemberSaccoRow[];
  }

  let groups: MemberGroupRow[] = [];
  if (saccoIds.length > 0) {
    const { data: groupRows, error: groupsError } = await appSupabase
      .from("ikimina")
      .select("*")
      .in("sacco_id", saccoIds)
      .order("name", { ascending: true });

    if (groupsError) {
      console.error("Failed to load groups", groupsError);
      throw new Error("Unable to load groups");
    }

    groups = (groupRows ?? []) as unknown as MemberGroupRow[];
  }

  const { data: joinRequests, error: joinError } = await legacyClient
    .from("join_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (joinError) {
    console.error("Failed to load join requests", joinError);
    throw new Error("Unable to load join requests");
  }

  return {
    profile: profileRow,
    saccos: saccoRows,
    groups,
    joinRequests: (joinRequests ?? []) as MemberJoinRequestRow[],
  };
});

export async function getMemberGroupSummary(groupId: string): Promise<{
  group: MemberGroupRow | null;
  sacco: MemberSaccoSummary | null;
}> {
  const appSupabase = supabaseSrv();
  const { data: group, error } = await appSupabase
    .from("ikimina")
    .select("*")
    .eq("id", groupId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load group", error);
    throw new Error("Unable to load group");
  }

  const groupRow = (group ?? null) as MemberGroupRow | null;

  if (!groupRow) {
    return { group: null, sacco: null };
  }

  const { data: sacco, error: saccoError } = await appSupabase
    .from("saccos")
    .select("id, name, district, sector_code, province, category")
    .eq("id", groupRow.sacco_id)
    .maybeSingle();

  if (saccoError) {
    console.error("Failed to load SACCO", saccoError);
    throw new Error("Unable to load SACCO");
  }

  return {
    group: groupRow,
    sacco: (sacco ?? null) as MemberSaccoSummary | null,
  };
}
