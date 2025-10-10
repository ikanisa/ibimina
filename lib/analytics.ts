import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const ACTIVE_PAYMENT_STATUSES = new Set(["POSTED", "SETTLED"]);

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface ExecutiveAnalyticsSnapshot {
  monthlyTrend: Array<{ monthKey: string; label: string; total: number }>;
  saccoLeaders: Array<{ saccoId: string | null; saccoName: string; total: number; unallocated: number }>;
  riskSignals: Array<{
    ikiminaId: string;
    name: string;
    saccoName: string | null;
    daysSince: number;
    lastContribution: string | null;
    risk: RiskLevel;
  }>;
  automation: {
    pendingRecon: number;
    pendingNotifications: number;
    escalations: number;
  };
  forecastNext: number;
}

const monthLabel = new Intl.DateTimeFormat("en-RW", { month: "short", year: "numeric" });

type PaymentRow = Pick<Database["public"]["Tables"]["payments"]["Row"], "amount" | "status" | "occurred_at" | "sacco_id" | "ikimina_id">;
type SaccoRow = Pick<Database["public"]["Tables"]["saccos"]["Row"], "id" | "name">;
type IkiminaMetaRow = Pick<Database["public"]["Tables"]["ibimina"]["Row"], "id" | "name" | "sacco_id"> & {
  saccos?: { name: string | null } | null;
};

const daysBetween = (latest: Date | null, today: Date) => {
  if (!latest) return Number.POSITIVE_INFINITY;
  return Math.floor((today.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24));
};

const toRiskLevel = (days: number): RiskLevel => {
  if (days >= 45) return "HIGH";
  if (days >= 30) return "MEDIUM";
  return "LOW";
};

export async function getExecutiveAnalytics(saccoId: string | null): Promise<ExecutiveAnalyticsSnapshot> {
  const supabase = await createSupabaseServerClient();
  const today = new Date();
  const lookback = new Date(today);
  lookback.setMonth(today.getMonth() - 6);

  let paymentsQuery = supabase
    .from("payments")
    .select("amount, status, occurred_at, sacco_id, ikimina_id")
    .gte("occurred_at", lookback.toISOString())
    .order("occurred_at", { ascending: false })
    .limit(5000);
  if (saccoId) {
    paymentsQuery = paymentsQuery.eq("sacco_id", saccoId);
  }
  const { data: paymentsData, error: paymentsError } = await paymentsQuery;
  if (paymentsError) throw paymentsError;

  const monthlyMap = new Map<string, { total: number; date: Date }>();
  const saccoTotals = new Map<string | null, { total: number; unallocated: number }>();
  const lastDepositByIkimina = new Map<string, Date>();
  const pendingReconStatuses = new Set(["UNALLOCATED", "PENDING"]);

  let pendingRecon = 0;

  for (const row of (paymentsData ?? []) as PaymentRow[]) {
    const occurred = new Date(row.occurred_at);
    const monthKey = `${occurred.getFullYear()}-${String(occurred.getMonth() + 1).padStart(2, "0")}`;
    const monthEntry = monthlyMap.get(monthKey) ?? { total: 0, date: new Date(occurred.getFullYear(), occurred.getMonth(), 1) };

    if (ACTIVE_PAYMENT_STATUSES.has(row.status ?? "")) {
      monthEntry.total += row.amount ?? 0;
      monthlyMap.set(monthKey, monthEntry);

      if (row.ikimina_id) {
        const currentLatest = lastDepositByIkimina.get(row.ikimina_id);
        if (!currentLatest || currentLatest < occurred) {
          lastDepositByIkimina.set(row.ikimina_id, occurred);
        }
      }
    }

    const saccoEntry = saccoTotals.get(row.sacco_id ?? null) ?? { total: 0, unallocated: 0 };
    if (ACTIVE_PAYMENT_STATUSES.has(row.status ?? "")) {
      saccoEntry.total += row.amount ?? 0;
    }
    if (row.status === "UNALLOCATED") {
      saccoEntry.unallocated += row.amount ?? 0;
    }
    saccoTotals.set(row.sacco_id ?? null, saccoEntry);

    if (pendingReconStatuses.has(row.status ?? "")) {
      pendingRecon += 1;
    }
  }

  const monthlyTrend = Array.from(monthlyMap.entries())
    .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
    .slice(-6)
    .map(([key, entry]) => ({
      monthKey: key,
      label: monthLabel.format(entry.date),
      total: Math.round(entry.total),
    }));

  // Forecast next month using average delta across the most recent intervals (up to last 3)
  let forecastNext = 0;
  if (monthlyTrend.length >= 2) {
    const totals = monthlyTrend.map((m) => m.total);
    const diffs: number[] = [];
    for (let i = totals.length - 1; i > 0 && diffs.length < 3; i--) {
      diffs.push(totals[i] - totals[i - 1]);
    }
    const avg = diffs.reduce((s, v) => s + v, 0) / diffs.length;
    forecastNext = Math.max(0, Math.round(totals[totals.length - 1] + avg));
  }

  const saccoIds = Array.from(
    new Set(
      Array.from(saccoTotals.keys()).filter((value): value is string => Boolean(value)),
    ),
  );

  let saccoLookup = new Map<string, string>();
  if (saccoIds.length > 0) {
    const { data: saccoRows } = await supabase
      .from("saccos")
      .select("id, name")
      .in("id", saccoIds);
    saccoLookup = new Map(((saccoRows ?? []) as SaccoRow[]).map((row) => [row.id, row.name ?? row.id]));
  }

  const saccoLeaders = Array.from(saccoTotals.entries())
    .map(([id, entry]) => ({
      saccoId: id,
      saccoName: id ? saccoLookup.get(id) ?? id : "All SACCOs",
      total: Math.round(entry.total),
      unallocated: Math.round(entry.unallocated),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const riskCandidates = Array.from(lastDepositByIkimina.entries())
    .map(([id, date]) => ({
      id,
      last: date,
      daysSince: daysBetween(date, today),
    }))
    .filter((entry) => entry.daysSince >= 14)
    .sort((a, b) => b.daysSince - a.daysSince)
    .slice(0, 12);

  const riskIkiminaIds = riskCandidates.map((entry) => entry.id);
  let riskMetaLookup = new Map<
    string,
    {
      name: string;
      saccoName: string | null;
    }
  >();
  if (riskIkiminaIds.length > 0) {
    const { data: riskMetaRows } = await supabase
      .from("ibimina")
      .select("id, name, sacco_id, saccos(name)")
      .in("id", riskIkiminaIds);
    riskMetaLookup = new Map(
      ((riskMetaRows ?? []) as IkiminaMetaRow[]).map((row) => [
        row.id,
        {
          name: row.name ?? "Unknown ikimina",
          saccoName: (row.saccos?.name ?? null) as string | null,
        },
      ]),
    );
  }

  const riskSignals = riskCandidates.map((candidate) => {
    const meta = riskMetaLookup.get(candidate.id);
    return {
      ikiminaId: candidate.id,
      name: meta?.name ?? "Unknown ikimina",
      saccoName: meta?.saccoName ?? null,
      daysSince: candidate.daysSince,
      lastContribution: candidate.last.toISOString(),
      risk: toRiskLevel(candidate.daysSince),
    };
  });

  let notificationQuery = supabase
    .from("notification_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "PENDING");
  if (saccoId) {
    notificationQuery = notificationQuery.eq("sacco_id", saccoId);
  }
  const { count: pendingNotifications } = await notificationQuery;

  const { data: escalationMetric } = await supabase
    .from("system_metrics")
    .select("event, total")
    .eq("event", "recon_escalations")
    .maybeSingle();

  const escalationMetricRow = (escalationMetric ?? null) as { total: number | null } | null;

  return {
    monthlyTrend,
    saccoLeaders,
    riskSignals,
    automation: {
      pendingRecon,
      pendingNotifications: pendingNotifications ?? 0,
      escalations: escalationMetricRow ? Number(escalationMetricRow.total ?? 0) : 0,
    },
    forecastNext,
  };
}
