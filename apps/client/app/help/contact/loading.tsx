/**
 * Help Contact Loading State
 */

import { Skeleton } from "@ibimina/ui/components/skeleton";

export default function HelpContactLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-6 max-w-4xl mx-auto">
      <Skeleton className="h-10 w-48 mb-6" aria-label="Loading title" />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Info */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-neutral-200 rounded-xl p-6">
              <Skeleton className="h-5 w-32 mb-3" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
