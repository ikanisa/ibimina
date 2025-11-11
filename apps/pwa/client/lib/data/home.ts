import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/types";
import {
  fetchAllocations,
  fetchCurrentUser,
  fetchReferenceTokens,
  type Allocation,
  type ReferenceToken,
  type User,
} from "@ibimina/data-access";

interface ContributionSettings {
  amount?: number;
  currency?: string;
}

export interface MemberGroupSummary {
  groupId: string;
  groupName: string;
  saccoId: string | null;
  saccoName: string | null;
  merchantCode: string | null;
  referenceToken: string;
  totalConfirmed: number;
  pendingCount: number;
  lastContributionAt: string | null;
  contribution: ContributionSettings;
}

export interface HomeDashboardData {
  member: User | null;
  referenceTokens: ReferenceToken[];
  groups: MemberGroupSummary[];
  recentAllocations: Allocation[];
  totals: {
    confirmedAmount: number;
    pendingCount: number;
  };
}

const CONFIRMED_STATUSES: Allocation["status"][] = ["posted", "reconciled"];

const isObject = (value: Json | null): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function extractContribution(settings: Json | null): ContributionSettings {
  if (!isObject(settings)) {
    return {};
  }

  const contribution = settings.contribution;
  if (!isObject(contribution)) {
    return {};
  }

  const amount = typeof contribution.amount === "number" ? contribution.amount : undefined;
  const currency =
    typeof contribution.currency === "string" && contribution.currency.length > 0
      ? contribution.currency
      : undefined;

  return { amount, currency };
}

export async function loadHomeDashboard(): Promise<HomeDashboardData> {
  const supabase = await createSupabaseServerClient();

  const [member, tokens] = await Promise.all([
    fetchCurrentUser(supabase),
    fetchReferenceTokens(supabase),
  ]);

  const referenceTokens = tokens.filter((token): token is ReferenceToken => Boolean(token.token));
  const tokenValues = referenceTokens.map((token) => token.token);

  const allocations = tokenValues.length
    ? await fetchAllocations(supabase, {
        referenceTokens: tokenValues,
        limit: 120,
      })
    : [];

  const groupIds = referenceTokens
    .map((token) => token.groupId)
    .filter((groupId): groupId is string => Boolean(groupId));

  let groupRows: Database["public"]["Tables"]["ibimina"]["Row"][] = [];
  if (groupIds.length) {
    const { data, error } = await supabase
      .from("ibimina")
      .select("id, name, sacco_id, settings_json")
      .in("id", groupIds);

    if (error) {
      console.error("Failed to load member groups", error);
    } else {
      groupRows = data ?? [];
    }
  }

  const saccoIds = Array.from(
    new Set(groupRows.map((group) => group.sacco_id).filter((id): id is string => Boolean(id)))
  );

  let saccoRows: Pick<
    Database["public"]["Tables"]["saccos"]["Row"],
    "id" | "name" | "merchant_code"
  >[] = [];
  if (saccoIds.length) {
    const { data, error } = await supabase
      .from("saccos")
      .select("id, name, merchant_code")
      .in("id", saccoIds);

    if (error) {
      console.error("Failed to load SACCO metadata", error);
    } else {
      saccoRows = data ?? [];
    }
  }

  const groupMap = new Map(groupRows.map((group) => [group.id, group] as const));
  const saccoMap = new Map(saccoRows.map((sacco) => [sacco.id, sacco] as const));

  const allocationsByToken = new Map<string, Allocation[]>();
  for (const allocation of allocations) {
    const list = allocationsByToken.get(allocation.referenceToken) ?? [];
    list.push(allocation);
    allocationsByToken.set(allocation.referenceToken, list);
  }

  const groups: MemberGroupSummary[] = referenceTokens.map((token) => {
    const group = token.groupId ? groupMap.get(token.groupId) : undefined;
    const sacco = (group?.sacco_id ? saccoMap.get(group.sacco_id) : null) ?? null;
    const groupAllocations = allocationsByToken.get(token.token) ?? [];

    const confirmedAllocations = groupAllocations.filter((allocation) =>
      CONFIRMED_STATUSES.includes(allocation.status)
    );
    const pendingAllocations = groupAllocations.filter(
      (allocation) => !CONFIRMED_STATUSES.includes(allocation.status)
    );

    const lastContributionAt =
      groupAllocations
        .map((allocation) => allocation.createdAt)
        .filter((value): value is string => Boolean(value))
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;

    const contribution = extractContribution(group?.settings_json ?? null);

    return {
      groupId: token.groupId ?? token.token,
      groupName: group?.name ?? token.groupName ?? token.token,
      saccoId: group?.sacco_id ?? token.saccoId ?? null,
      saccoName: sacco?.name ?? null,
      merchantCode: sacco?.merchant_code ?? null,
      referenceToken: token.token,
      totalConfirmed: confirmedAllocations.reduce((sum, allocation) => sum + allocation.amount, 0),
      pendingCount: pendingAllocations.length,
      lastContributionAt,
      contribution,
    } satisfies MemberGroupSummary;
  });

  const recentAllocations = [...allocations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const totals = allocations.reduce(
    (acc, allocation) => {
      if (CONFIRMED_STATUSES.includes(allocation.status)) {
        acc.confirmedAmount += allocation.amount;
      } else {
        acc.pendingCount += 1;
      }
      return acc;
    },
    { confirmedAmount: 0, pendingCount: 0 }
  );

  return {
    member,
    referenceTokens,
    groups,
    recentAllocations,
    totals,
  };
}
