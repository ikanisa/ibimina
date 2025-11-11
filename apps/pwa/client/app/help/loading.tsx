/**
 * Help Center Loading State
 */

import { CardSkeleton, Skeleton } from "@ibimina/ui/components/skeleton";

export default function HelpLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <Skeleton className="h-10 w-48 mb-6" aria-label="Loading title" />
        <Skeleton className="h-12 w-full mb-8 rounded-xl" aria-label="Loading search" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-40 mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
