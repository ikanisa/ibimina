import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const ACTIVE_PAYMENT_STATUSES = new Set(["POSTED", "SETTLED"]);
const DAYS_THRESHOLD = 30;

type PaymentRow = Pick<Database["public"]["Tables"]["payments"]["Row"], "amount" | "status" | "occurred_at" | "ikimina_id" | "member_id">;
type IkiminaRow = Pick<Database["public"]["Tables"]["ibimina"]["Row"], "id" | "name" | "code" | "status" | "updated_at">;
type MemberRow = Pick<Database["public"]["Tables"]["ikimina_members"]["Row"], "id" | "full_name" | "msisdn" | "member_code" | "ikimina_id" | "status">;

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

function toISOString(date: Date) {
  return date.toISOString();
}

export async function getDashboardSummary(saccoId: string | null): Promise<DashboardSummary> {
  const supabase = await createSupabaseServerClient();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let paymentsQuery = supabase
    .from("payments")
    .select("amount, status, occurred_at, ikimina_id, member_id")
    .gte("occurred_at", toISOString(startOfMonth));

  if (saccoId) {
    paymentsQuery = paymentsQuery.eq("sacco_id", saccoId);
  }

  const { data: payments, error: paymentsError } = await paymentsQuery;

  if (paymentsError) {
    throw paymentsError;
  }

  const totals = {
    today: 0,
    week: 0,
    month: 0,
    unallocated: 0,
  };

  const groupTotals = new Map<string, { amount: number; members: Set<string> }>();
  const memberLastPayment = new Map<string, Date>();

  for (const payment of (payments as PaymentRow[] | null) ?? []) {
    const occurred = new Date(payment.occurred_at);
    if (ACTIVE_PAYMENT_STATUSES.has(payment.status)) {
      totals.month += payment.amount;
      if (occurred >= startOfWeek) {
        totals.week += payment.amount;
      }
      if (occurred >= startOfToday) {
        totals.today += payment.amount;
      }
    }

    if (payment.status === "UNALLOCATED") {
      totals.unallocated += 1;
    }

    if (payment.ikimina_id) {
      const current = groupTotals.get(payment.ikimina_id) ?? { amount: 0, members: new Set<string>() };
      current.amount += ACTIVE_PAYMENT_STATUSES.has(payment.status) ? payment.amount : 0;
      if (payment.member_id) {
        current.members.add(payment.member_id);
      }
      groupTotals.set(payment.ikimina_id, current);
    }

    if (payment.member_id) {
      const existing = memberLastPayment.get(payment.member_id);
      if (!existing || existing < occurred) {
        memberLastPayment.set(payment.member_id, occurred);
      }
    }
  }

  const groupIdsFromPayments = Array.from(groupTotals.keys());

  const topGroupEntries = groupIdsFromPayments
    .map((id) => [id, groupTotals.get(id)!] as const)
    .sort((a, b) => b[1].amount - a[1].amount);

  const topGroupIds = topGroupEntries.slice(0, 5).map(([id]) => id);
  const groupMetaMap = new Map<string, IkiminaRow>();

  if (topGroupIds.length > 0) {
    const { data: topGroupsMeta } = await supabase
      .from("ibimina")
      .select("id, name, code, status, updated_at")
      .in("id", topGroupIds);

    topGroupsMeta?.forEach((group) => {
      groupMetaMap.set(group.id, group);
    });
  }

  // Fallback: if no payments or metadata missing, fetch latest ikimina
  if (topGroupIds.length === 0 || groupMetaMap.size < topGroupIds.length) {
    let fallbackQuery = supabase
      .from("ibimina")
      .select("id, name, code, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5);

    if (saccoId) {
      fallbackQuery = fallbackQuery.eq("sacco_id", saccoId);
    }

    const { data: fallbackGroups } = await fallbackQuery;
    fallbackGroups?.forEach((group) => {
      if (!groupMetaMap.has(group.id)) {
        groupMetaMap.set(group.id, group);
        if (!groupTotals.has(group.id)) {
          groupTotals.set(group.id, { amount: 0, members: new Set<string>() });
          topGroupEntries.push([group.id, groupTotals.get(group.id)!]);
        }
      }
    });
  }

  const groupIdsForMembers = topGroupEntries.slice(0, 5).map(([id]) => id);

  let membersForGroups: MemberRow[] = [];
  if (groupIdsForMembers.length > 0) {
    const { data: memberRows } = await supabase
      .from("ikimina_members")
      .select("id, full_name, msisdn, member_code, ikimina_id, status")
      .eq("status", "ACTIVE")
      .in("ikimina_id", groupIdsForMembers)
      .limit(500);
    if (memberRows) {
      membersForGroups = memberRows as MemberRow[];
    }
  }

  const memberCounts = new Map<string, number>();
  for (const member of membersForGroups) {
    memberCounts.set(member.ikimina_id ?? "", (memberCounts.get(member.ikimina_id ?? "") ?? 0) + 1);
  }

  const topIkimina = topGroupEntries
    .slice(0, 5)
    .map(([id, info]) => {
      const meta = groupMetaMap.get(id);
      return {
        id,
        name: meta?.name ?? "Unknown",
        code: meta?.code ?? "—",
        status: meta?.status ?? "UNKNOWN",
        updated_at: meta?.updated_at ?? null,
        month_total: info.amount,
        member_count: memberCounts.get(id) ?? info.members.size,
      };
    });

  const overdueMembers = membersForGroups
    .map((member) => {
      const lastPayment = memberLastPayment.get(member.id) ?? null;
      const daysSince = lastPayment ? Math.ceil((now.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24)) : null;
      const ikiminaMeta = groupMetaMap.get(member.ikimina_id ?? "");
      return {
        id: member.id,
        full_name: member.full_name,
        msisdn: member.msisdn,
        member_code: member.member_code,
        ikimina_id: member.ikimina_id ?? null,
        ikimina_name: ikiminaMeta?.name ?? null,
        days_since: daysSince,
      };
    })
    .filter((item) => item.days_since === null || item.days_since > DAYS_THRESHOLD)
    .sort((a, b) => {
      const daysA = a.days_since ?? Number.POSITIVE_INFINITY;
      const daysB = b.days_since ?? Number.POSITIVE_INFINITY;
      return daysB - daysA;
    })
    .slice(0, 6);

  let activeIkiminaCount = 0;
  let countQuery = supabase.from("ibimina").select("id", { count: "exact", head: true });
  if (saccoId) {
    countQuery = countQuery.eq("sacco_id", saccoId);
  }
  countQuery = countQuery.eq("status", "ACTIVE");
  const { count, error: countError } = await countQuery;
  if (countError) {
    throw countError;
  }
  activeIkiminaCount = count ?? 0;

  return {
    totals,
    activeIkimina: activeIkiminaCount,
    topIkimina,
    missedContributors: overdueMembers,
  };
}
