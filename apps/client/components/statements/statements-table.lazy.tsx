"use client";

import dynamic from "next/dynamic";

import type { StatementsTableProps } from "./statements-table";

const LoadingSkeleton = () => (
  <div className="rounded-2xl border border-neutral-200 bg-white p-6">
    <div className="mb-4 h-6 w-48 animate-pulse rounded bg-neutral-200" aria-hidden="true" />
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`summary-skeleton-${index}`}
          className="space-y-2 rounded-lg border border-neutral-200 p-4"
        >
          <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" aria-hidden="true" />
          <div className="h-6 w-32 animate-pulse rounded bg-neutral-200" aria-hidden="true" />
        </div>
      ))}
    </div>
    <div className="mt-6 space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`row-skeleton-${index}`}
          className="h-12 animate-pulse rounded-lg bg-neutral-100"
          aria-hidden="true"
        />
      ))}
    </div>
    <span className="sr-only">Loading statements…</span>
  </div>
);

export const StatementsTableLazy = dynamic<StatementsTableProps>(
  () => import("./statements-table").then((mod) => mod.StatementsTable),
  {
    ssr: false,
    loading: () => <LoadingSkeleton />,
  }
);
