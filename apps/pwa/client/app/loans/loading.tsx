/**
 * Loans Page Loading State
 * Implements P0 Fix: H1.1 - No loading states on data fetch
 */

import { CardSkeleton, Skeleton } from "@ibimina/ui/components/skeleton";

export default function LoansLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-6">
      {/* Page Header */}
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" aria-label="Loading page title" />
        <Skeleton className="h-4 w-96" aria-label="Loading page description" />
      </div>

      {/* Loan Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} className="h-80" />
        ))}
      </div>
    </div>
  );
}
