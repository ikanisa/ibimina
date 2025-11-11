/**
 * Terms of Service Loading State
 */

import { Skeleton } from "@ibimina/ui/components/skeleton";

export default function TermsLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-6 max-w-4xl mx-auto">
      <Skeleton className="h-10 w-64 mb-4" aria-label="Loading title" />
      <div className="space-y-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}
