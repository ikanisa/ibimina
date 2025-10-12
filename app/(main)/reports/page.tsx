import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SaccoSearchResult } from "@/components/saccos/sacco-search-combobox";
import { ReportsClient } from "./client";
import { mapSubscriptionRow } from "./subscription-utils";
import type { ReportSubscription } from "./types";

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subscriptionRows } = await (supabase as any)
    .schema("app")
    .from("report_subscriptions")
    .select(
      "id, sacco_id, email, frequency, format, delivery_hour, delivery_day, filters, is_active, last_run_at, next_run_at, created_at",
    )
    .order("created_at", { ascending: false });

  const subscriptions: ReportSubscription[] = (subscriptionRows ?? []).map(mapSubscriptionRow);

  const ikiminaCount = ikimina?.length ?? 0;

  return (
    <ReportsClient
      initialSacco={initialSacco}
      ikiminaCount={ikiminaCount}
      saccoOptions={saccos}
      subscriptions={subscriptions}
      isSystemAdmin={profile.role === "SYSTEM_ADMIN"}
      profileSaccoId={profile.sacco_id ?? null}
    />
  );
}
