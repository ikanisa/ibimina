/**
 * Statements Page Loading State
 * Implements P0 Fix: H1.1 - No loading states on data fetch
 */

import { CardSkeleton, Skeleton } from "@ibimina/ui/components/skeleton";

export default function StatementsLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-6">
      {/* Page Header Skeleton */}
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" aria-label="Loading page title" />
        <Skeleton className="h-4 w-64" aria-label="Loading page description" />
      </div>

      {/* Filter Controls Skeleton */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Statements List Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} className="animate-pulse" />
        ))}
      </div>
    </div>
  );
}
