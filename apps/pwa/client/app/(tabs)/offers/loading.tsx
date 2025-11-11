/**
 * Offers Page Loading State
 * Implements P0 Fix: H1.1 - No loading states on data fetch
 */

import { CardSkeleton } from "@ibimina/ui/components/skeleton";

export default function OffersLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-6">
      {/* Grid of offer cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}
