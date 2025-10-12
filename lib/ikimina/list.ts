import { cacheWithTags, CACHE_TAGS, REVALIDATION_SECONDS } from "@/lib/performance/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type { IkiminaTableRow } from "@/components/ikimina/ikimina-table";

const ACTIVE_PAYMENT_STATUSES = new Set(["POSTED", "SETTLED"]);

interface IkiminaDirectoryParams {
  saccoId: string | null;
  includeAll: boolean;
}

export interface IkiminaDirectoryResult {
  rows: IkiminaTableRow[];
  statusOptions: string[];
  typeOptions: string[];
  saccoOptions: string[];
}

async function fetchIkiminaDirectory({ saccoId, includeAll }: IkiminaDirectoryParams): Promise<IkiminaDirectoryResult> {
  if (!includeAll && !saccoId) {
    return { rows: [], statusOptions: [], typeOptions: [], saccoOptions: [] };
  }

  const supabase = await createSupabaseServerClient();
  const baseQuery = supabase
    .from("ibimina")
    .select("id, name, code, status, type, sacco_id, created_at, updated_at, saccos(name)")
    .order("updated_at", { ascending: false })
    .limit(500);

  const { data, error } = includeAll ? await baseQuery : await baseQuery.eq("sacco_id", saccoId ?? "");

  if (error) {
    throw error;
  }

  type IkiminaRow = Database["public"]["Tables"]["ibimina"]["Row"] & {
    saccos: { name: string | null } | null;
  };

  const rawRows = (data ?? []) as IkiminaRow[];
  if (rawRows.length === 0) {
    return { rows: [], statusOptions: [], typeOptions: [], saccoOptions: [] };
  }

  const groupIds = rawRows.map((row) => row.id);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWindow = new Date(now);
  startOfWindow.setDate(now.getDate() - 60);

  const memberCounts = new Map<string, number>();
  const aggregates = new Map<string, { monthTotal: number; lastPaymentAt: string | null; unallocated: number }>();

  if (groupIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const memberPromise = (supabase as unknown as any)
      .from("ikimina_members_public")
      .select("ikimina_id, count")
      .in("ikimina_id", groupIds)
      .group("ikimina_id");

    const paymentsPromise = supabase
      .from("payments")
      .select("ikimina_id, amount, status, occurred_at")
      .in("ikimina_id", groupIds)
      .gte("occurred_at", startOfWindow.toISOString())
      .order("occurred_at", { ascending: false })
      .range(0, 4999);

    const [memberResponse, paymentResponse] = await Promise.all([memberPromise, paymentsPromise]);

    if (memberResponse.error) {
      throw memberResponse.error;
    }

    if (paymentResponse.error) {
      throw paymentResponse.error;
    }

    type MemberCountRow = { ikimina_id: string | null; count: number | null };
    for (const row of (memberResponse.data ?? []) as MemberCountRow[]) {
      if (!row.ikimina_id) continue;
      memberCounts.set(row.ikimina_id, Number(row.count ?? 0));
    }

    type PaymentRow = Pick<Database["public"]["Tables"]["payments"]["Row"], "ikimina_id" | "amount" | "status" | "occurred_at">;
    for (const payment of (paymentResponse.data ?? []) as PaymentRow[]) {
      const groupId = payment.ikimina_id;
      if (!groupId) continue;

      const bucket = aggregates.get(groupId) ?? {
        monthTotal: 0,
        lastPaymentAt: null,
        unallocated: 0,
      };

      const occurred = new Date(payment.occurred_at);

      if (ACTIVE_PAYMENT_STATUSES.has(payment.status ?? "") && occurred >= startOfMonth) {
        bucket.monthTotal += payment.amount ?? 0;
      }

      if (!bucket.lastPaymentAt || new Date(bucket.lastPaymentAt) < occurred) {
        bucket.lastPaymentAt = occurred.toISOString();
      }

      if (payment.status === "UNALLOCATED") {
        bucket.unallocated += 1;
      }

      aggregates.set(groupId, bucket);
    }
  }

  const rows: IkiminaTableRow[] = rawRows.map((row) => {
    const aggregate = aggregates.get(row.id);
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      status: row.status,
      type: row.type,
      members_count: memberCounts.get(row.id) ?? 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
      month_total: aggregate?.monthTotal ?? 0,
      last_payment_at: aggregate?.lastPaymentAt ?? row.updated_at,
      unallocated_count: aggregate?.unallocated ?? 0,
      sacco_name: row.saccos?.name ?? null,
    } satisfies IkiminaTableRow;
  });

  const statusOptions = Array.from(new Set(rows.map((row) => row.status).filter(Boolean))).sort();
  const typeOptions = Array.from(new Set(rows.map((row) => row.type).filter(Boolean))).sort();
  const saccoOptions = includeAll
    ? Array.from(
        new Set(
          rows
            .map((row) => row.sacco_name)
            .filter((value): value is string => Boolean(value))
        )
      ).sort()
    : [];

  return { rows, statusOptions, typeOptions, saccoOptions };
}

export async function getIkiminaDirectorySummary(params: IkiminaDirectoryParams): Promise<IkiminaDirectoryResult> {
  const { saccoId, includeAll } = params;
  const keyParts = ["ikimina-directory", includeAll ? "all" : saccoId ?? "none"];
  const cached = cacheWithTags(
    () => fetchIkiminaDirectory(params),
    keyParts,
    [CACHE_TAGS.ikiminaDirectory, CACHE_TAGS.sacco(saccoId ?? null)],
    includeAll ? REVALIDATION_SECONDS.minute : REVALIDATION_SECONDS.fiveMinutes
  );

  return cached();
}
