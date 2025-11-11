/**
 * Chat Page Loading State
 * Implements P0 Fix: H1.1 - No loading states on data fetch
 */

import { Skeleton, ListItemSkeleton } from "@ibimina/ui/components/skeleton";

export default function ChatLoading() {
  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Chat List Sidebar */}
      <div className="w-80 border-r border-neutral-200 bg-white p-4">
        <Skeleton className="h-10 w-full mb-4" aria-label="Loading search" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b border-neutral-200 p-4 bg-white">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <Skeleton className={`h-16 ${i % 2 === 0 ? "w-64" : "w-48"} rounded-2xl`} />
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-neutral-200 p-4 bg-white">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
