/**
 * Share Page Loading State
 */

import { Skeleton } from "@ibimina/ui/components/skeleton";

export default function ShareLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-5 w-64 mx-auto" />
        </div>
        <div className="flex gap-3 justify-center">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}
