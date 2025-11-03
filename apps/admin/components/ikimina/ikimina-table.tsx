"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import type { CellContext, ColumnDef } from "@tanstack/react-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { StatusChip } from "@/components/common/status-chip";
import { DataTable } from "@/src/components/common/DataTable";
import { FilterBar, type FilterChipDefinition } from "@/src/components/common/FilterBar";
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

  const filtersState = useMemo(
    () => ({ search, status, type, sacco }),
    [search, status, type, sacco]
  );

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

  const handleRestoreFilters = useCallback((next: Record<string, unknown>) => {
    setSearch(String(next.search ?? ""));
    setStatus(next.status ? String(next.status) : "");
    setType(next.type ? String(next.type) : "");
    setSacco(next.sacco ? String(next.sacco) : "");
  }, []);

  const filterChips = useMemo<FilterChipDefinition[]>(
    () => [
      {
        id: "search",
        label: t("table.search", "Search"),
        valueLabel: search ? `“${search}”` : undefined,
        active: Boolean(search),
        renderEditor: () => (
          <Input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("table.searchPlaceholder", "Search by name or code")}
            className="w-full"
          />
        ),
        onClear: () => setSearch(""),
      },
      {
        id: "status",
        label: t("table.status", "Status"),
        valueLabel: status || undefined,
        active: Boolean(status),
        renderEditor: ({ close }) => (
          <div className="space-y-2">
            {statusOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={cn(
                  "w-full rounded-lg border border-white/10 px-3 py-2 text-left text-sm transition",
                  status === option
                    ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-100"
                    : "hover:border-white/20"
                )}
                onClick={() => {
                  setStatus(option === status ? "" : option);
                  close();
                }}
              >
                {option}
              </button>
            ))}
          </div>
        ),
        onClear: () => setStatus(""),
      },
      {
        id: "type",
        label: t("table.type", "Type"),
        valueLabel: type || undefined,
        active: Boolean(type),
        renderEditor: ({ close }) => (
          <div className="space-y-2">
            {typeOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={cn(
                  "w-full rounded-lg border border-white/10 px-3 py-2 text-left text-sm transition",
                  type === option
                    ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-100"
                    : "hover:border-white/20"
                )}
                onClick={() => {
                  setType(option === type ? "" : option);
                  close();
                }}
              >
                {option}
              </button>
            ))}
          </div>
        ),
        onClear: () => setType(""),
      },
      ...(saccoOptions && saccoOptions.length > 0
        ? ([
            {
              id: "sacco",
              label: t("table.sacco", "SACCO"),
              valueLabel: sacco || undefined,
              active: Boolean(sacco),
              renderEditor: ({ close }) => (
                <div className="space-y-2">
                  {saccoOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={cn(
                        "w-full rounded-lg border border-white/10 px-3 py-2 text-left text-sm transition",
                        sacco === option
                          ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-100"
                          : "hover:border-white/20"
                      )}
                      onClick={() => {
                        setSacco(option === sacco ? "" : option);
                        close();
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ),
              onClear: () => setSacco(""),
            },
          ] satisfies FilterChipDefinition[])
        : []),
    ],
    [sacco, saccoOptions, search, status, statusOptions, t, type, typeOptions]
  );

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
            size: 180,
            meta: { align: "left" },
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
        size: 260,
        meta: { pinned: "left" },
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
        size: 150,
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
        size: 130,
        meta: { align: "right", cellClassName: "font-semibold" },
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
        size: 180,
        meta: { align: "right", cellClassName: "font-semibold" },
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
        size: 180,
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
        size: 150,
        meta: { align: "right" },
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
        size: 150,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("common.actions", "Actions")}</span>,
        cell: ({ row }: CellContext<IkiminaTableRow, unknown>) => (
          <Link
            href={`/ikimina/${row.original.id}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.3em] text-neutral-0 transition hover:bg-white/10"
          >
            {t("common.open", "Open")}
          </Link>
        ),
        size: 160,
        meta: { align: "right", cellClassName: "justify-end", pinned: "right" },
      },
    ].filter(Boolean) as ColumnDef<IkiminaTableRow, unknown>[];

    return baseColumns;
  }, [showSaccoColumn, t]);

  return (
    <DataTable
      data={filteredRows}
      columns={columns}
      tableHeight={560}
      empty={
        <EmptyState
          title={t("ikimina.list.emptyTitle", "No ikimina")}
          description={t(
            "ikimina.list.emptyDescription",
            "Try adjusting filters or create a new group."
          )}
        />
      }
      filterBar={
        <FilterBar
          filters={filterChips}
          onClearAll={() => {
            setSearch("");
            setStatus("");
            setType("");
            setSacco("");
          }}
        />
      }
      filtersState={filtersState}
      onFiltersStateChange={handleRestoreFilters}
      viewScope="ikimina-directory"
      initialDensity="cozy"
      disableVirtualization={filteredRows.length < 20}
    />
  );
}
