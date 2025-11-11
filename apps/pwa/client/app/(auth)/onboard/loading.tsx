/**
 * Onboarding Page Loading State
 */

import { Skeleton } from "@ibimina/ui/components/skeleton";

export default function OnboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <Skeleton className="h-2 w-full rounded-full" aria-label="Loading progress" />
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-8 space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-full" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>

          <div className="flex gap-3">
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
