"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import type { CellContext, ColumnDef } from "@tanstack/react-table";
import { VirtualTable } from "@/components/datagrid/virtual-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusChip } from "@/components/common/status-chip";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";

export interface IkiminaTableRow {
  id: string;
  name: string;
  code: string;
  status: string;
  type: string;
  members_count: number;
  created_at: string | null;
  updated_at: string | null;
  month_total: number;
  last_payment_at: string | null;
  unallocated_count: number;
  sacco_name?: string | null;
}

interface IkiminaTableProps {
  rows: IkiminaTableRow[];
  statusOptions: string[];
  typeOptions: string[];
  saccoOptions?: string[];
  showSaccoColumn?: boolean;
}

const currencyFormatter = new Intl.NumberFormat("en-RW", {
  style: "currency",
  currency: "RWF",
  maximumFractionDigits: 0,
});

const relativeDate = (value: string | null) => {
  if (!value) return "—";
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return "—";
  const now = new Date();
  const diffMs = now.getTime() - target.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  return target.toLocaleDateString();
};

export function IkiminaTable({
  rows,
  statusOptions,
  typeOptions,
  saccoOptions,
  showSaccoColumn = false,
}: IkiminaTableProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [sacco, setSacco] = useState<string>("");

  const deferredSearch = useDeferredValue(search);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch = deferredSearch
        ? row.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
          row.code.toLowerCase().includes(deferredSearch.toLowerCase())
        : true;
      const matchesStatus = status ? row.status === status : true;
      const matchesType = type ? row.type === type : true;
      const matchesSacco = sacco ? row.sacco_name === sacco : true;
      return matchesSearch && matchesStatus && matchesType && matchesSacco;
    });
  }, [rows, deferredSearch, status, type, sacco]);

  const columns = useMemo<ColumnDef<IkiminaTableRow, unknown>[]>(() => {
    const baseColumns: ColumnDef<IkiminaTableRow, unknown>[] = [
      showSaccoColumn
        ? {
            accessorKey: "sacco_name",
            header: () => (
              <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">
                {t("table.sacco", "SACCO")}
              </span>
            ),
            cell: (info: CellContext<IkiminaTableRow, unknown>) => {
              const value = info.getValue<string | null>();
              return <span className="text-sm text-neutral-2">{value ?? "—"}</span>;
            },
            meta: { template: "minmax(160px, 1fr)" },
          }
        : undefined,
      {
        accessorKey: "name",
        header: () => (
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">
            {t("table.name", "Name")}
          </span>
        ),
        cell: (info: CellContext<IkiminaTableRow, unknown>) => (
          <div>
            <p className="font-medium text-neutral-0">{info.row.original.name}</p>
            <p className="text-xs text-neutral-2">Code · {info.row.original.code}</p>
          </div>
        ),
        meta: { template: "minmax(220px, 2fr)" },
      },
      {
        accessorKey: "type",
        header: () => (
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">
            {t("table.type", "Type")}
          </span>
        ),
        cell: (info: CellContext<IkiminaTableRow, unknown>) => (
          <span className="text-sm text-neutral-0">{String(info.getValue() ?? "—")}</span>
        ),
        meta: { template: "minmax(120px, 0.8fr)" },
      },
      {
        accessorKey: "members_count",
        header: () => (
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">
            {t("table.members", "Members")}
          </span>
        ),
        cell: (info: CellContext<IkiminaTableRow, unknown>) => (
          <span className="font-semibold text-neutral-0">{String(info.getValue() ?? 0)}</span>
        ),
        meta: { align: "right", template: "minmax(110px, 0.7fr)", cellClassName: "font-semibold" },
      },
      {
        accessorKey: "month_total",
        header: () => (
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">
            {t("table.mtdVolume", "MTD volume")}
          </span>
        ),
        cell: (info: CellContext<IkiminaTableRow, unknown>) =>
          currencyFormatter.format(Number(info.getValue() ?? 0)),
        meta: { align: "right", template: "minmax(140px, 0.9fr)", cellClassName: "font-semibold" },
      },
      {
        accessorKey: "last_payment_at",
        header: () => (
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">
            {t("table.lastPayment", "Last payment")}
          </span>
        ),
        cell: (info: CellContext<IkiminaTableRow, unknown>) => (
          <span className="text-sm text-neutral-0">
            {relativeDate(info.getValue<string | null>() ?? null)}
          </span>
        ),
        meta: { template: "minmax(150px, 0.9fr)" },
      },
      {
        accessorKey: "unallocated_count",
        header: () => (
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">
            {t("table.exceptions", "Exceptions")}
          </span>
        ),
        cell: (info: CellContext<IkiminaTableRow, unknown>) => {
          const value = Number(info.getValue() ?? 0);
          return (
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs uppercase tracking-[0.25em]",
                value > 0 ? "bg-amber-500/20 text-amber-200" : "bg-white/10 text-neutral-2"
              )}
            >
              {value}
            </span>
          );
        },
        meta: { align: "right", template: "minmax(120px, 0.7fr)" },
      },
      {
        accessorKey: "status",
        header: () => (
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">
            {t("table.status", "Status")}
          </span>
        ),
        cell: (info: CellContext<IkiminaTableRow, unknown>) => (
          <StatusChip tone="neutral">{String(info.getValue() ?? "")}</StatusChip>
        ),
        meta: { template: "minmax(120px, 0.7fr)" },
      },
      {
        id: "actions",
        header: () => null,
        cell: ({ row }: CellContext<IkiminaTableRow, unknown>) => (
          <Link
            href={`/ikimina/${row.original.id}`}
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.3em] text-neutral-0 transition hover:bg-white/10"
          >
            {t("common.open", "Open")}
          </Link>
        ),
        meta: { align: "right", template: "minmax(90px, 0.6fr)" },
      },
    ].filter(Boolean) as ColumnDef<IkiminaTableRow, unknown>[];

    return baseColumns;
  }, [showSaccoColumn, t]);

  const showSaccoFilter = Boolean(saccoOptions && saccoOptions.length > 1);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Input
          label={t("ikimina.list.searchLabel", "Search")}
          placeholder={t("ikimina.list.searchPlaceholder", "Search name or code")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {showSaccoFilter && (
          <Select
            label={t("table.sacco", "SACCO")}
            value={sacco}
            onChange={(event) => setSacco(event.target.value)}
            options={["", ...(saccoOptions ?? [])]}
            emptyLabel={t("common.all", "All")}
          />
        )}
        <Select
          label={t("table.status", "Status")}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={["", ...statusOptions]}
          emptyLabel={t("common.all", "All")}
        />
        <Select
          label={t("table.type", "Type")}
          value={type}
          onChange={(event) => setType(event.target.value)}
          options={["", ...typeOptions]}
          emptyLabel={t("common.all", "All")}
        />
        <button
          type="button"
          onClick={() => {
            setSearch("");
            setStatus("");
            setType("");
            setSacco("");
          }}
          className="self-end rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-neutral-2"
        >
          {t("reports.filters.reset", "Reset filters")}
        </button>
      </div>
      <VirtualTable
        data={filteredRows}
        columns={columns}
        emptyState={
          <EmptyState
            title={t("ikimina.list.emptyTitle", "No ikimina")}
            description={t(
              "ikimina.list.emptyDescription",
              "Try adjusting filters or create a new group."
            )}
          />
        }
      />
    </div>
  );
}
