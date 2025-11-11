import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchAllocations, fetchReferenceTokens, type Allocation } from "@ibimina/data-access";
import type { StatementEntry } from "@/components/statements/statements-table";

const STATUS_MAP: Record<Allocation["status"], StatementEntry["status"]> = {
  pending: "PENDING",
  posted: "CONFIRMED",
  failed: "PENDING",
  reconciled: "CONFIRMED",
};

export interface StatementsData {
  entries: StatementEntry[];
  totalConfirmed: number;
  pendingCount: number;
}

export async function loadStatements(limit = 120): Promise<StatementsData> {
  const supabase = await createSupabaseServerClient();
  const tokens = await fetchReferenceTokens(supabase);
  const referenceTokens = tokens
    .map((token) => token.token)
    .filter((value): value is string => Boolean(value));

  if (!referenceTokens.length) {
    return { entries: [], totalConfirmed: 0, pendingCount: 0 };
  }

  const allocations = await fetchAllocations(supabase, {
    referenceTokens,
    limit,
  });

  const entries: StatementEntry[] = allocations.map((allocation) => ({
    id: allocation.id,
    date: allocation.createdAt,
    amount: allocation.amount,
    txnId: allocation.momoTxnId ?? allocation.id,
    status: STATUS_MAP[allocation.status],
    groupName: allocation.groupName ?? "Unknown Group",
    reference: allocation.referenceToken,
  }));

  const totalConfirmed = allocations
    .filter((allocation) => allocation.status === "posted" || allocation.status === "reconciled")
    .reduce((sum, allocation) => sum + allocation.amount, 0);

  const pendingCount = allocations.filter((allocation) => allocation.status === "pending").length;

  return {
    entries,
    totalConfirmed,
    pendingCount,
  };
}
