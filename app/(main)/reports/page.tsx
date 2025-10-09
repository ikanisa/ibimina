import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SaccoSearchResult } from "@/components/saccos/sacco-search-combobox";
import { ReportsClient } from "./client";

export default async function ReportsPage() {
  const { profile } = await requireUserAndProfile();
  const supabase = await createSupabaseServerClient();

  const ikiminaQuery = supabase
    .from("ibimina")
    .select("id, name")
    .order("name", { ascending: true })
    .limit(50);

  const { data: ikimina } =
    profile.role === "SYSTEM_ADMIN"
      ? await ikiminaQuery
      : await ikiminaQuery.eq("sacco_id", profile.sacco_id ?? "");

  const saccos =
    profile.role === "SYSTEM_ADMIN"
      ? ((await supabase
          .from("saccos")
          .select("id, name, district, province, category")
          .order("name", { ascending: true })).data as SaccoSearchResult[] | null ?? [])
      : profile.saccos
      ? [
          {
            id: profile.saccos.id,
            name: profile.saccos.name,
            district: profile.saccos.district ?? "",
            province: profile.saccos.province ?? "",
            category: profile.saccos.category ?? "",
          } satisfies SaccoSearchResult,
        ]
      : ([] as SaccoSearchResult[]);

  const initialSacco: SaccoSearchResult | null = saccos.length === 1 ? saccos[0]! : null;

  return <ReportsClient initialSacco={initialSacco} ikiminaCount={ikimina?.length ?? 0} />;
}
