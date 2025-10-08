"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { DashboardSummary } from "@/lib/dashboard";
import { VirtualTable } from "@/components/datagrid/virtual-table";
import { BilingualText } from "@/components/common/bilingual-text";
import { StatusChip } from "@/components/common/status-chip";
import { EmptyState } from "@/components/ui/empty-state";

interface TopIkiminaTableProps {
  data: DashboardSummary["topIkimina"];
  tableHeight?: number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(amount);

export function TopIkiminaTable({ data, tableHeight = 260 }: TopIkiminaTableProps) {
  const columns = useMemo<ColumnDef<DashboardSummary["topIkimina"][number]>[]>(
    () => [
      {
        accessorKey: "name",
        header: () => (
          <BilingualText
            primary="Ikimina"
            secondary="Itsinda"
            secondaryClassName="text-[10px] text-neutral-3"
          />
        ),
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-0">{row.original.name}</p>
            <p className="text-xs text-neutral-2">Code · {row.original.code}</p>
          </div>
        ),
      },
      {
        accessorKey: "updated_at",
        header: () => (
          <BilingualText
            primary="Updated"
            secondary="Igihe gishize"
            secondaryClassName="text-[10px] text-neutral-3"
          />
        ),
        cell: ({ getValue }) => {
          const value = getValue() as string | null;
          return value ? new Date(value).toLocaleDateString() : "—";
        },
      },
      {
        accessorKey: "month_total",
        header: () => (
          <BilingualText
            primary="This month"
            secondary="Ukwezi"
            secondaryClassName="text-[10px] text-neutral-3"
          />
        ),
        cell: ({ getValue }) => formatCurrency(Number(getValue() ?? 0)),
        meta: { align: "right" as const },
      },
      {
        accessorKey: "member_count",
        header: () => (
          <BilingualText
            primary="Members"
            secondary="Abanyamuryango"
            secondaryClassName="text-[10px] text-neutral-3"
          />
        ),
        cell: ({ getValue }) => <span className="text-neutral-0">{Number(getValue() ?? 0)}</span>,
      },
      {
        accessorKey: "status",
        header: () => (
          <BilingualText
            primary="Status"
            secondary="Imiterere"
            secondaryClassName="text-[10px] text-neutral-3"
          />
        ),
        cell: ({ getValue }) => <StatusChip tone="neutral">{String(getValue() ?? "UNKNOWN")}</StatusChip>,
      },
    ],
    []
  );

  const empty = (
    <EmptyState
      title="No ikimina activity"
      description="Recent groups will show here once transactions start flowing."
    />
  );

  return (
    <VirtualTable
      data={data}
      columns={columns}
      tableHeight={tableHeight}
      emptyState={empty}
    />
  );
}
