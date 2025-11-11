/**
 * Login Page Loading State
 */

import { Skeleton } from "@ibimina/ui/components/skeleton";

export default function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <Skeleton className="h-10 w-48 mx-auto" aria-label="Loading title" />
          <Skeleton className="h-4 w-64 mx-auto" aria-label="Loading subtitle" />
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-8 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
