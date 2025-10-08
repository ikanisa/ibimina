import { GradientHeader } from "@/components/ui/gradient-header";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { IkiminaTable, type IkiminaTableRow } from "@/components/ikimina/ikimina-table";
import { BilingualText } from "@/components/common/bilingual-text";
import type { Database } from "@/lib/supabase/types";

const ACTIVE_PAYMENT_STATUSES = new Set(["POSTED", "SETTLED"]);

export default async function IkiminaPage() {
  const { profile } = await requireUserAndProfile();
  const supabase = await createSupabaseServerClient();

  const baseQuery = supabase
    .from("ibimina")
    .select("id, name, code, status, type, sacco_id, created_at, updated_at, saccos(name)")
    .order("updated_at", { ascending: false })
    .limit(500);

  const { data, error } =
    profile.role === "SYSTEM_ADMIN"
      ? await baseQuery
      : await baseQuery.eq("sacco_id", profile.sacco_id ?? "");

  if (error) {
    throw error;
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWindow = new Date(now);
  startOfWindow.setDate(now.getDate() - 60);

  type IkiminaRow = Database["public"]["Tables"]["ibimina"]["Row"] & {
    saccos: { name: string | null } | null;
  };

  const rawRows = (data ?? []) as IkiminaRow[];
  const groupIds = rawRows.map((row) => row.id);

  const memberCounts = new Map<string, number>();

  if (groupIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const memberCountQuery = (supabase as any)
      .from("ikimina_members_public")
      .select("ikimina_id, count")
      .in("ikimina_id", groupIds)
      .group("ikimina_id");

    const { data: memberCountRows, error: memberCountError } = await memberCountQuery;

    if (memberCountError) {
      throw memberCountError;
    }

    type MemberCountRow = { ikimina_id: string | null; count: number | null };
    for (const row of (memberCountRows ?? []) as MemberCountRow[]) {
      if (!row.ikimina_id) continue;
      memberCounts.set(row.ikimina_id, Number(row.count ?? 0));
    }
  }

  const aggregates = new Map<
    string,
    {
      monthTotal: number;
      lastPaymentAt: string | null;
      unallocated: number;
    }
  >();

  if (groupIds.length > 0) {
    const { data: paymentData } = await supabase
      .from("payments")
      .select("ikimina_id, amount, status, occurred_at")
      .in("ikimina_id", groupIds)
      .gte("occurred_at", startOfWindow.toISOString())
      .order("occurred_at", { ascending: false })
      .range(0, 4999);

    type PaymentRow = Pick<Database["public"]["Tables"]["payments"]["Row"], "ikimina_id" | "amount" | "status" | "occurred_at">;
    for (const payment of (paymentData ?? []) as PaymentRow[]) {
      const groupId = payment.ikimina_id;
      if (!groupId) continue;
      const bucket = aggregates.get(groupId) ?? {
        monthTotal: 0,
        lastPaymentAt: null,
        unallocated: 0,
      };

      const occurred = new Date(payment.occurred_at);

      if (ACTIVE_PAYMENT_STATUSES.has(payment.status) && occurred >= startOfMonth) {
        bucket.monthTotal += payment.amount;
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

  const statusOptions = Array.from(new Set(rows.map((row) => row.status))).sort();
  const typeOptions = Array.from(new Set(rows.map((row) => row.type))).sort();
  const saccoOptions = profile.role === "SYSTEM_ADMIN"
    ? Array.from(new Set(rows.map((row) => row.sacco_name).filter((value): value is string => Boolean(value)))).sort()
    : [];

  return (
    <div className="space-y-8">
      <GradientHeader
        title={<BilingualText primary="Ikimina Directory" secondary="Urutonde rw'amatsinda" />}
        subtitle={
          <BilingualText
            primary="Browse, filter, and drill into every group under your SACCO."
            secondary="Reba, tongera n'isesengure amatsinda yose ari muri SACCO yawe."
            secondaryClassName="text-xs text-ink/70"
          />
        }
      />
      <IkiminaTable
        rows={rows}
        statusOptions={statusOptions}
        typeOptions={typeOptions}
        saccoOptions={saccoOptions}
        showSaccoColumn={profile.role === "SYSTEM_ADMIN"}
      />
    </div>
  );
}
