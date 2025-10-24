import { cacheWithTags, CACHE_TAGS, REVALIDATION_SECONDS } from "@/lib/performance/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const DAYS_THRESHOLD = 30;

export interface DashboardSummary {
  totals: {
    today: number;
    week: number;
    month: number;
    unallocated: number;
  };
  activeIkimina: number;
  topIkimina: Array<{
    id: string;
    name: string;
    code: string;
    status: string;
    updated_at: string | null;
    month_total: number;
    member_count: number;
  }>;
  missedContributors: Array<{
    id: string;
    full_name: string;
    msisdn: string | null;
    member_code: string | null;
    ikimina_id: string | null;
    ikimina_name: string | null;
    days_since: number | null;
  }>;
}

export const EMPTY_DASHBOARD_SUMMARY: DashboardSummary = {
  totals: {
    today: 0,
    week: 0,
    month: 0,
    unallocated: 0,
  },
  activeIkimina: 0,
  topIkimina: [],
  missedContributors: [],
};

interface DashboardSummaryParams {
  saccoId: string | null;
  allowAll: boolean;
}

type PaymentRollupRow = {
  sacco_id: string | null;
  month_total: number | null;
  week_total: number | null;
  today_total: number | null;
  unallocated_count: number | null;
};

type IkiminaMonthlyRow = {
  ikimina_id: string | null;
  sacco_id: string | null;
  name: string | null;
  code: string | null;
  status: string | null;
  updated_at: string | null;
  month_total: number | null;
  active_member_count: number | null;
  contributing_members: number | null;
  last_contribution_at: string | null;
};

type MemberLastPaymentRow = {
  member_id: string | null;
  full_name: string | null;
  msisdn: string | null;
  member_code: string | null;
  ikimina_id: string | null;
  ikimina_name: string | null;
  days_since_last: number | null;
  status: string | null;
};

async function computeDashboardSummary({ saccoId, allowAll }: DashboardSummaryParams): Promise<DashboardSummary> {
  if (process.env.AUTH_E2E_STUB === "1") {
    return {
      totals: {
        today: 580000,
        week: 3425000,
        month: 12750000,
        unallocated: 3,
      },
      activeIkimina: 18,
      topIkimina: [
        {
          id: "stub-ikimina-1",
          name: "Imbere Heza",
          code: "IMB-001",
          status: "ACTIVE",
          updated_at: new Date().toISOString(),
          month_total: 4900000,
          member_count: 52,
        },
        {
          id: "stub-ikimina-2",
          name: "Abishyizehamwe",
          code: "ABI-014",
          status: "ACTIVE",
          updated_at: new Date().toISOString(),
          month_total: 3180000,
          member_count: 47,
        },
      ],
      missedContributors: [
        {
          id: "member-1",
          full_name: "Mukamana Chantal",
          msisdn: "+250788123456",
          member_code: "MC-221",
          ikimina_id: "stub-ikimina-1",
          ikimina_name: "Imbere Heza",
          days_since: 16,
        },
      ],
    } satisfies DashboardSummary;
  }

  if (!allowAll && !saccoId) {
    return EMPTY_DASHBOARD_SUMMARY;
  }

  const supabase = await createSupabaseServerClient();
  const analyticsClient = supabase.schema("app");
  const typedAnalytics = analyticsClient as unknown as SupabaseClient<Database>;

  const resolveRollup = async (): Promise<PaymentRollupRow | null> => {
    if (allowAll) {
      const { data, error } = await typedAnalytics
        .from("analytics_payment_rollups_mv")
        .select("sacco_id, month_total, week_total, today_total, unallocated_count")
        .is("sacco_id", null)
        .maybeSingle();
      if (error) {
        throw error;
      }
      return data ?? null;
    }

    if (!saccoId) {
      return null;
    }

    const { data, error } = await typedAnalytics
      .from("analytics_payment_rollups_mv")
      .select("sacco_id, month_total, week_total, today_total, unallocated_count")
      .eq("sacco_id", saccoId)
      .maybeSingle();
    if (error) {
      throw error;
    }

    if (data) {
      return data;
    }

    const { data: fallback } = await typedAnalytics
      .from("analytics_payment_rollups_mv")
      .select("sacco_id, month_total, week_total, today_total, unallocated_count")
      .is("sacco_id", null)
      .maybeSingle();
    return (fallback as PaymentRollupRow | null) ?? null;
  };

  const rollup = await resolveRollup();

  const totals = {
    today: Number(rollup?.today_total ?? 0),
    week: Number(rollup?.week_total ?? 0),
    month: Number(rollup?.month_total ?? 0),
    unallocated: Number(rollup?.unallocated_count ?? 0),
  } satisfies DashboardSummary["totals"];

  let ikiminaQuery = typedAnalytics
    .from("analytics_ikimina_monthly_mv")
    .select(
      "ikimina_id, sacco_id, name, code, status, updated_at, month_total, active_member_count, contributing_members, last_contribution_at",
    )
    .order("month_total", { ascending: false })
    .limit(5);

  if (!allowAll && saccoId) {
    ikiminaQuery = ikiminaQuery.eq("sacco_id", saccoId);
  }

  const { data: ikiminaRows, error: ikiminaError } = await ikiminaQuery;
  if (ikiminaError) {
    throw ikiminaError;
  }

  const topIkimina = ((ikiminaRows ?? []) as IkiminaMonthlyRow[]).map((row) => ({
    id: row.ikimina_id as string,
    name: (row.name as string) ?? "Unknown",
    code: (row.code as string) ?? "—",
    status: (row.status as string) ?? "UNKNOWN",
    updated_at: (row.updated_at as string | null) ?? null,
    month_total: Number(row.month_total ?? 0),
    member_count: Number(row.active_member_count ?? row.contributing_members ?? 0),
  }));

  let overdueQuery = typedAnalytics
    .from("analytics_member_last_payment_mv")
    .select("member_id, full_name, msisdn, member_code, ikimina_id, ikimina_name, days_since_last, status")
    .eq("status", "ACTIVE")
    .order("days_since_last", { ascending: false })
    .limit(12);

  if (!allowAll && saccoId) {
    overdueQuery = overdueQuery.eq("sacco_id", saccoId);
  }

  const { data: overdueRows, error: overdueError } = await overdueQuery;
  if (overdueError) {
    throw overdueError;
  }

  const missedContributors = ((overdueRows ?? []) as MemberLastPaymentRow[])
    .filter((row) => typeof row.member_id === "string" && (row.member_id?.length ?? 0) > 0)
    .map((row) => ({
      id: row.member_id as string,
      full_name: row.full_name ?? "Unknown member",
      msisdn: row.msisdn ?? null,
      member_code: row.member_code ?? null,
      ikimina_id: row.ikimina_id ?? null,
      ikimina_name: row.ikimina_name ?? null,
      days_since: row.days_since_last == null ? null : Number(row.days_since_last),
    } satisfies DashboardSummary["missedContributors"][number]))
    .filter((entry) => entry.days_since === null || Number.isFinite(entry.days_since))
    .filter((entry) => entry.days_since === null || entry.days_since > DAYS_THRESHOLD)
    .slice(0, 6);

  let activeIkiminaCount = 0;
  let countQuery = supabase.schema("app").from("ikimina").select("id", { count: "exact", head: true }).eq("status", "ACTIVE");
  if (!allowAll && saccoId) {
    countQuery = countQuery.eq("sacco_id", saccoId);
  }
  const { count, error: countError } = await countQuery;
  if (countError) {
    throw countError;
  }
  activeIkiminaCount = count ?? 0;

  return {
    totals,
    activeIkimina: activeIkiminaCount,
    topIkimina,
    missedContributors,
  } satisfies DashboardSummary;
}

export async function getDashboardSummary(params: DashboardSummaryParams): Promise<DashboardSummary> {
  const { saccoId, allowAll } = params;
  const saccoTag = CACHE_TAGS.sacco(saccoId ?? null);
  const analyticsTag = CACHE_TAGS.analyticsExecutive(saccoId ?? null);
  const cached = cacheWithTags(
    () => computeDashboardSummary(params),
    ["dashboard-summary", allowAll ? "all" : "scoped", saccoId ?? "none"],
    [CACHE_TAGS.dashboardSummary, saccoTag, analyticsTag],
    allowAll ? REVALIDATION_SECONDS.minute : REVALIDATION_SECONDS.fiveMinutes
  );

  return cached();
}
