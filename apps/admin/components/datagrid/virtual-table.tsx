"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

export interface VirtualTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  className?: string;
  tableHeight?: number;
  emptyState?: React.ReactNode;
}

interface ColumnMeta {
  template?: string;
  align?: "left" | "center" | "right";
  headerClassName?: string;
  cellClassName?: string;
}

export function VirtualTable<TData>({ data, columns, className, tableHeight = 480, emptyState }: VirtualTableProps<TData>) {
  // TanStack Table cannot be memoized safely by React Compiler; this hook needs to run on every render.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<TData>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const parentRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 8,
  });

  const totalSize = rowVirtualizer.getTotalSize();
  const virtualItems = rowVirtualizer.getVirtualItems();

  const headerGroups = table.getHeaderGroups();

  const gridTemplate = useMemo(() => {
    const firstGroup = table.getHeaderGroups()[0];
    if (!firstGroup) return "repeat(auto-fit, minmax(0, 1fr))";
    return firstGroup.headers
      .map((header) => {
        const meta = header.column.columnDef.meta as ColumnMeta | undefined;
        return meta?.template ?? "minmax(0, 1fr)";
      })
      .join(" ");
  }, [table]);

  const gridStyle = useMemo(() => ({
    gridTemplateColumns: gridTemplate,
  }), [gridTemplate]);

  const content = useMemo(() => {
    if (table.getRowModel().rows.length === 0 && emptyState) {
      return <div className="flex h-full items-center justify-center">{emptyState}</div>;
    }
    return (
      <div
        ref={parentRef}
        className="relative overflow-auto"
        style={{ height: tableHeight }}
      >
        <div style={{ height: totalSize, position: "relative" }}>
          {virtualItems.map((virtualRow) => {
            const row = table.getRowModel().rows[virtualRow.index];
            return (
              <div
                key={row.id}
                className="grid gap-x-4 border-b border-white/10 px-4 py-3 text-sm text-neutral-0"
                style={{
                  ...gridStyle,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                  background: virtualRow.index % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                }}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as ColumnMeta | undefined;
                  const alignClass =
                    meta?.align === "right"
                      ? "text-right"
                      : meta?.align === "center"
                      ? "text-center"
                      : "text-left";
                  return (
                    <div key={cell.id} className={cn("truncate", alignClass, meta?.cellClassName)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [emptyState, gridStyle, table, tableHeight, totalSize, virtualItems]);

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-white/10 text-sm", className)}>
      <div className="bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.2em] text-neutral-2">
        <div className="grid gap-x-4" style={gridStyle}>
          {headerGroups.map((headerGroup) =>
            headerGroup.headers.map((header) => {
              const meta = header.column.columnDef.meta as ColumnMeta | undefined;
              const alignClass =
                meta?.align === "right"
                  ? "text-right"
                  : meta?.align === "center"
                  ? "text-center"
                  : "text-left";
              return (
                <div
                  key={header.id}
                  className={cn("truncate text-xs uppercase tracking-[0.2em] text-neutral-2", alignClass, meta?.headerClassName)}
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </div>
              );
            })
          )}
        </div>
      </div>
      {content}
    </div>
  );
}
