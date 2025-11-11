/**
 * Pay Sheet Loading State
 */

import { Skeleton } from "@ibimina/ui/components/skeleton";

export default function PaySheetLoading() {
  return (
    <div className="flex min-h-screen items-end justify-center bg-neutral-900/50 p-4">
      <div className="w-full max-w-lg bg-white rounded-t-3xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>

        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
