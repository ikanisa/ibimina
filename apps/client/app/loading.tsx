/**
 * Root Page Loading State (Home)
 */

import { CardSkeleton, Skeleton } from "@ibimina/ui/components/skeleton";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="h-10 w-48 mb-2" aria-label="Loading title" />
        <Skeleton className="h-5 w-64" aria-label="Loading subtitle" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
