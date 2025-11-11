/**
 * Help FAQ Loading State
 */

import { Skeleton } from "@ibimina/ui/components/skeleton";

export default function HelpFaqLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-6 max-w-4xl mx-auto">
      <Skeleton className="h-10 w-48 mb-6" aria-label="Loading title" />
      <Skeleton className="h-12 w-full mb-6 rounded-xl" aria-label="Loading search" />

      <div className="space-y-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-white border border-neutral-200 rounded-xl p-4">
            <Skeleton className="h-5 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
