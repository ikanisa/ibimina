/**
 * Statements Table Component
 *
 * Displays allocation-based transaction statements with filtering and export capabilities.
 *
 * Features:
 * - Date filters (This Month, Last Month, Custom)
 * - Entry rows with date, amount, transaction ID, status
 * - Status badges (CONFIRMED, PENDING)
 * - PDF export functionality
 * - Large, readable text
 * - Mobile-first responsive design
 */

"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Calendar, Download, ChevronDown } from "lucide-react";

import { fmtCurrency } from "@/utils/format";

export interface StatementEntry {
  id: string;
  date: string;
  amount: number;
  txnId: string;
  status: "CONFIRMED" | "PENDING";
  groupName: string;
  reference: string;
}

interface StatementsTableProps {
  entries: StatementEntry[];
  onExportPDF?: (period: string) => void;
}

type FilterOption = "this-month" | "last-month" | "custom";

const GRID_TEMPLATE =
  "minmax(9rem,1.1fr) minmax(9rem,1fr) minmax(8rem,0.9fr) minmax(10rem,1.1fr) minmax(7rem,0.8fr)";
const ROW_HEIGHT = 72;
const OVERSCAN_COUNT = 6;

export function StatementsTable({ entries, onExportPDF }: StatementsTableProps) {
  const [filter, setFilter] = useState<FilterOption>("this-month");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const filterMenuId = useId();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const virtualizedContainerRef = useRef<HTMLDivElement | null>(null);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    []
  );

  const filteredEntries = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);

    return entries.filter((entry) => {
      const entryDate = new Date(entry.date);

      if (filter === "this-month") {
        return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
      }

      if (filter === "last-month") {
        return (
          entryDate.getMonth() === lastMonthDate.getMonth() &&
          entryDate.getFullYear() === lastMonthDate.getFullYear()
        );
      }

      return true;
    });
  }, [entries, filter]);

  const { totalAmount, confirmedCount, pendingCount } = useMemo(() => {
    return filteredEntries.reduce(
      (acc, entry) => {
        acc.totalAmount += entry.amount;
        if (entry.status === "CONFIRMED") {
          acc.confirmedCount += 1;
        }
        if (entry.status === "PENDING") {
          acc.pendingCount += 1;
        }
        return acc;
      },
      { totalAmount: 0, confirmedCount: 0, pendingCount: 0 }
    );
  }, [filteredEntries]);

  const shouldVirtualize = filteredEntries.length > 25;

  useEffect(() => {
    if (!shouldVirtualize) {
      return;
    }

    const container = virtualizedContainerRef.current;
    if (!container) {
      return;
    }

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [shouldVirtualize, filter]);

  useEffect(() => {
    if (!shouldVirtualize) {
      return;
    }

    const container = virtualizedContainerRef.current;
    if (!container || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      setViewportHeight(container.clientHeight);
    });

    observer.observe(container);
    setViewportHeight(container.clientHeight);

    return () => {
      observer.disconnect();
    };
  }, [shouldVirtualize, filter]);

  useEffect(() => {
    if (!isFilterOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [isFilterOpen]);

  useEffect(() => {
    if (!shouldVirtualize) {
      virtualizedContainerRef.current?.scrollTo({ top: 0 });
      return;
    }

    virtualizedContainerRef.current?.scrollTo({ top: 0 });
  }, [filter, shouldVirtualize]);

  const totalHeight = filteredEntries.length * ROW_HEIGHT;
  const effectiveViewport = viewportHeight || ROW_HEIGHT * 10;
  const startIndex = shouldVirtualize
    ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN_COUNT)
    : 0;
  const endIndex = shouldVirtualize
    ? Math.min(
        filteredEntries.length,
        Math.ceil((scrollTop + effectiveViewport) / ROW_HEIGHT) + OVERSCAN_COUNT
      )
    : filteredEntries.length;

  const visibleEntries = filteredEntries.slice(startIndex, endIndex);

  const filterOptions: Array<{ value: FilterOption; label: string }> = [
    { value: "this-month", label: "This Month" },
    { value: "last-month", label: "Last Month" },
    { value: "custom", label: "Custom Period" },
  ];

  const handleExport = () => {
    if (onExportPDF) {
      const periodName =
        filter === "this-month"
          ? "This Month"
          : filter === "last-month"
            ? "Last Month"
            : "Custom Period";
      onExportPDF(periodName);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header with Filter and Export */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsFilterOpen((open) => !open)}
            className="flex min-h-[48px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-left transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Filter statements by period"
            aria-expanded={isFilterOpen}
            aria-haspopup="listbox"
            aria-controls={isFilterOpen ? filterMenuId : undefined}
            type="button"
          >
            <Calendar className="h-5 w-5 text-gray-600" aria-hidden="true" />
            <span className="text-sm font-medium text-gray-900">
              {filter === "this-month"
                ? "This Month"
                : filter === "last-month"
                  ? "Last Month"
                  : "Custom"}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-600" aria-hidden="true" />
          </button>

          {isFilterOpen && (
            <ul
              id={filterMenuId}
              className="absolute top-full left-0 z-10 mt-2 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
              role="listbox"
            >
              {filterOptions.map((option) => (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={filter === option.value}
                    onClick={() => {
                      setFilter(option.value);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors focus:outline-none focus-visible:bg-blue-50 focus-visible:text-blue-700 ${
                      filter === option.value
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          className="flex min-h-[48px] items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Export statements as PDF"
          type="button"
        >
          <Download className="h-5 w-5" aria-hidden="true" />
          <span>Export PDF</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-600">Total</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{fmtCurrency(totalAmount)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-600">Confirmed</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{confirmedCount}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-600">Pending</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
      </div>

      {/* Statements List */}
      {filteredEntries.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">No statements found for the selected period.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white">
          {/* Mobile layout without virtualization for readability */}
          <div className="sm:hidden">
            {filteredEntries.map((entry) => (
              <article
                key={entry.id}
                className="flex flex-col gap-2 border-b border-gray-200 p-4 last:border-b-0"
                aria-label={`Statement for ${entry.groupName}`}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">{entry.groupName}</span>
                  <span className="font-semibold text-gray-900">{fmtCurrency(entry.amount)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  <span>{dateFormatter.format(new Date(entry.date))}</span>
                  <span className="font-mono">{entry.txnId}</span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${
                      entry.status === "CONFIRMED"
                        ? "border-green-200 bg-green-100 text-green-800"
                        : "border-yellow-200 bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {entry.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
          <div
            className="hidden divide-y divide-gray-200 sm:block"
            role="table"
            aria-label="Statement history"
          >
            <div role="rowgroup">
              <div
                role="row"
                className="grid w-full bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-700"
                style={{ gridTemplateColumns: GRID_TEMPLATE }}
              >
                <div role="columnheader">Date</div>
                <div role="columnheader">Group</div>
                <div role="columnheader" className="text-right">
                  Amount
                </div>
                <div role="columnheader">Txn ID</div>
                <div role="columnheader">Status</div>
              </div>
            </div>

            {shouldVirtualize ? (
              <div
                ref={virtualizedContainerRef}
                className="relative max-h-[28rem] overflow-y-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                role="rowgroup"
                aria-live="polite"
                tabIndex={0}
              >
                <div aria-hidden="true" style={{ height: totalHeight }} />
                {visibleEntries.map((entry, visibleIndex) => {
                  const absoluteIndex = startIndex + visibleIndex;
                  return (
                    <div
                      key={entry.id}
                      role="row"
                      className="absolute inset-x-0 grid items-center bg-white px-4 py-4 text-sm text-gray-900 transition-colors hover:bg-gray-50"
                      style={{
                        transform: `translateY(${absoluteIndex * ROW_HEIGHT}px)`,
                        gridTemplateColumns: GRID_TEMPLATE,
                      }}
                    >
                      <span role="cell">{dateFormatter.format(new Date(entry.date))}</span>
                      <span role="cell">{entry.groupName}</span>
                      <span role="cell" className="text-right font-semibold">
                        {fmtCurrency(entry.amount)}
                      </span>
                      <span role="cell" className="font-mono text-gray-600">
                        {entry.txnId}
                      </span>
                      <span role="cell">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            entry.status === "CONFIRMED"
                              ? "border-green-200 bg-green-100 text-green-800"
                              : "border-yellow-200 bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {entry.status}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="max-h-[28rem] overflow-y-auto" role="rowgroup" aria-live="polite">
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    role="row"
                    className="grid items-center px-4 py-4 text-sm text-gray-900 transition-colors hover:bg-gray-50"
                    style={{ gridTemplateColumns: GRID_TEMPLATE }}
                  >
                    <span role="cell">{dateFormatter.format(new Date(entry.date))}</span>
                    <span role="cell">{entry.groupName}</span>
                    <span role="cell" className="text-right font-semibold">
                      {fmtCurrency(entry.amount)}
                    </span>
                    <span role="cell" className="font-mono text-gray-600">
                      {entry.txnId}
                    </span>
                    <span role="cell">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          entry.status === "CONFIRMED"
                            ? "border-green-200 bg-green-100 text-green-800"
                            : "border-yellow-200 bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
