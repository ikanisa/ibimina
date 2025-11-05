/**
 * Welcome Page Loading State
 */

import { Skeleton } from "@ibimina/ui/components/skeleton";

export default function WelcomeLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 p-4">
      <div className="w-full max-w-md text-center space-y-8">
        <Skeleton className="h-20 w-20 rounded-full mx-auto" aria-label="Loading logo" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-5 w-full mx-auto" />
          <Skeleton className="h-5 w-5/6 mx-auto" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
