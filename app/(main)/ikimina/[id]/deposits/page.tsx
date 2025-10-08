import { notFound } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusChip } from "@/components/common/status-chip";
import { StatementImportWizard } from "@/components/ikimina/statement-import-wizard";
import { VirtualTable } from "@/components/datagrid/virtual-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ColumnDef } from "@tanstack/react-table";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatAmount(value: number, currency?: string | null) {
  return new Intl.NumberFormat("en-RW", { style: "currency", currency: currency ?? "RWF", maximumFractionDigits: 0 }).format(value);
}

export default async function DepositsPage({ params }: PageProps) {
  const { id } = await params;
  const { profile } = await requireUserAndProfile();
  const supabase = await createSupabaseServerClient();

  const { data: group, error: groupError } = await supabase
    .from("ibimina")
    .select("id, sacco_id, name")
    .eq("id", id)
    .maybeSingle();

  if (groupError) {
    throw groupError;
  }

  if (!group) {
    notFound();
  }

  if (profile.role !== "SYSTEM_ADMIN" && profile.sacco_id && profile.sacco_id !== group.sacco_id) {
    notFound();
  }

  const { data: deposits, error: depositsError } = await supabase
    .from("payments")
    .select("id, amount, currency, status, occurred_at, reference, msisdn")
    .eq("ikimina_id", id)
    .order("occurred_at", { ascending: false })
    .limit(500);

  if (depositsError) {
    throw depositsError;
  }

  const columns: ColumnDef<NonNullable<typeof deposits>[number]>[] = [
    {
      accessorKey: "occurred_at",
      header: "Occurred",
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatAmount(row.original.amount, row.original.currency),
    },
    {
      accessorKey: "reference",
      header: "Reference",
      cell: ({ getValue }) => (getValue() as string | null) ?? "—",
    },
    {
      accessorKey: "msisdn",
      header: "MSISDN",
      cell: ({ getValue }) => (getValue() as string | null) ?? "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => (
        <StatusChip tone={(getValue() as string) === "POSTED" || (getValue() as string) === "SETTLED" ? "success" : "warning"}>
          {getValue() as string}
        </StatusChip>
      ),
    },
  ];

  return (
    <GlassCard
      title={`Deposits · ${group.name}`}
      subtitle={`${deposits?.length ?? 0} recent payments`}
      actions={<StatementImportWizard saccoId={group.sacco_id} ikiminaId={group.id} />}
    >
      <VirtualTable
        data={deposits ?? []}
        columns={columns}
        tableHeight={360}
        emptyState={<EmptyState title="No deposits" description="Use the statement wizard to ingest CSV files." />}
      />
    </GlassCard>
  );
}
