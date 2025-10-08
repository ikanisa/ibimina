"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { VirtualTable } from "@/components/datagrid/virtual-table";
import { StatusChip } from "@/components/common/status-chip";
import { EmptyState } from "@/components/ui/empty-state";

export interface IkiminaDepositRecord {
  id: string;
  amount: number;
  currency: string | null;
  status: string;
  occurred_at: string;
  reference: string | null;
  msisdn: string | null;
}

interface IkiminaDepositsTableProps {
  data: IkiminaDepositRecord[];
  tableHeight?: number;
}

const formatAmount = (value: number, currency?: string | null) =>
  new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: currency ?? "RWF",
    maximumFractionDigits: 0,
  }).format(value);

export function IkiminaDepositsTable({ data, tableHeight = 360 }: IkiminaDepositsTableProps) {
  const columns = useMemo<ColumnDef<IkiminaDepositRecord>[]>(
    () => [
      {
        accessorKey: "occurred_at",
        header: "Occurred",
        cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => formatAmount(row.original.amount, row.original.currency),
        meta: { align: "right" as const },
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
    ],
    []
  );

  const empty = (
    <EmptyState
      title="No deposits"
      description="Use the statement wizard to ingest CSV files."
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
