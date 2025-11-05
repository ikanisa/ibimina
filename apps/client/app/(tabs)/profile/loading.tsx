/**
 * Profile Page Loading State
 * Implements P0 Fix: H1.1 - No loading states on data fetch
 */

import { Skeleton } from "@ibimina/ui/components/skeleton";

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-6">
      {/* Profile Header */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-20 w-20 rounded-full" aria-label="Loading profile picture" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      {/* Profile Sections */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white border border-neutral-200 rounded-2xl p-6 mb-4">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      ))}
    </div>
  );
}
