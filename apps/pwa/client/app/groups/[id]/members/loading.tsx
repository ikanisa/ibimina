/**
 * Group Members Page Loading State
 * Implements P0 Fix: H1.1 - No loading states on data fetch
 */

import { ListItemSkeleton, Skeleton } from "@ibimina/ui/components/skeleton";

export default function GroupMembersLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-6">
      {/* Group Header */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 mb-6">
        <Skeleton className="h-7 w-64 mb-2" aria-label="Loading group name" />
        <Skeleton className="h-4 w-48" aria-label="Loading group details" />
      </div>

      {/* Members List */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
