/**
 * Offline Page Loading State
 * Note: This page should rarely show loading as it's for offline state
 */

import { Skeleton } from "@ibimina/ui/components/skeleton";

export default function OfflineLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <div className="text-center space-y-4">
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-5 w-64 mx-auto" />
      </div>
    </div>
  );
}
