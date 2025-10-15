import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type MemberProfileRow = Database["public"]["Tables"]["members_app_profiles"]["Row"];
export type MemberSaccoRow = Database["public"]["Tables"]["saccos"]["Row"];
export type MemberGroupRow = Database["public"]["Tables"]["ibimina"]["Row"];
export type MemberJoinRequestRow = Database["public"]["Tables"]["join_requests"]["Row"];
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { profile: null, saccos: [], groups: [], joinRequests: [] };
  }

  const [{ data: profile, error: profileError }, { data: saccos, error: saccoError }] = await Promise.all([
    supabase.from("members_app_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("saccos")
      .select("id, name, district, sector_code, province, category, status")
      .order("name", { ascending: true }),
  ]);

  if (profileError) {
    console.error("Failed to load member profile", profileError);
    throw new Error("Unable to load member profile");
  }
  if (saccoError) {
    console.error("Failed to load member SACCOs", saccoError);
    throw new Error("Unable to load SACCO list");
  }

  const profileRow = (profile ?? null) as MemberProfileRow | null;
  const saccoRows = (saccos ?? []) as MemberSaccoRow[];

  let groups: MemberGroupRow[] = [];
  if (saccoRows.length > 0) {
    const { data: groupRows, error: groupsError } = await supabase
      .from("ibimina")
      .select("*")
      .in(
        "sacco_id",
        saccoRows.map((s) => s.id)
      )
      .order("name", { ascending: true });

    if (groupsError) {
      console.error("Failed to load groups", groupsError);
      throw new Error("Unable to load groups");
    }

    groups = (groupRows ?? []) as MemberGroupRow[];
  }

  const { data: joinRequests, error: joinError } = await supabase
    .from("join_requests")
    .select("*")
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
  const supabase = await createSupabaseServerClient();
  const {
    data: group,
    error,
  } = await supabase
    .from("ibimina")
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

  const { data: sacco, error: saccoError } = await supabase
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
