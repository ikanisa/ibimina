/**
 * Wallet Page Loading State
 * Implements P0 Fix: H1.1 - No loading states on data fetch
 */

import { CardSkeleton, Skeleton } from "@ibimina/ui/components/skeleton";

export default function WalletLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-6">
      {/* Balance Card Skeleton */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 mb-6">
        <Skeleton className="h-4 w-24 mb-2" aria-label="Loading balance label" />
        <Skeleton className="h-10 w-48 mb-4" aria-label="Loading balance amount" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Tokens Grid */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
