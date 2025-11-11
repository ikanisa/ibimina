/**
 * Support Page Loading State
 * Implements P0 Fix: H1.1 - No loading states on data fetch
 */

import { CardSkeleton, Skeleton } from "@ibimina/ui/components/skeleton";

export default function SupportLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" aria-label="Loading page title" />
        <Skeleton className="h-4 w-96" aria-label="Loading page description" />
      </div>

      {/* Search */}
      <Skeleton className="h-12 w-full mb-6 rounded-xl" aria-label="Loading search" />

      {/* FAQ Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Recent Articles */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32 mb-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
