import { CardSkeleton } from "@ibimina/ui";

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20" aria-busy="true" aria-live="polite">
      <p className="sr-only" role="status">
        Loading your home dashboard. Balances, quick actions, and recent confirmations will appear
        shortly.
      </p>
      {/* Header skeleton */}
      <div className="bg-gradient-to-br from-brand-blue via-brand-blue-dark to-brand-blue-darker px-4 py-10">
        <div className="max-w-screen-xl mx-auto space-y-3">
          <div className="h-10 w-64 bg-white/20 rounded-lg animate-pulse" />
          <div className="h-5 w-96 bg-white/15 rounded animate-pulse" />
        </div>
      </div>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Quick actions skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[110px] bg-white border border-neutral-200 rounded-2xl animate-pulse"
            />
          ))}
        </div>

        {/* Groups skeleton */}
        <section className="space-y-4">
          <div className="h-7 w-32 bg-neutral-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </section>

        {/* Recent confirmations skeleton */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-7 w-48 bg-neutral-200 rounded animate-pulse" />
            <div className="h-4 w-16 bg-neutral-200 rounded animate-pulse" />
          </div>
          <div className="bg-white border border-neutral-200 rounded-2xl divide-y divide-neutral-100">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-neutral-200 rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-neutral-200 rounded animate-pulse" />
                  <div className="h-5 w-24 bg-neutral-200 rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Insights skeleton */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
              <div className="h-3 w-32 bg-neutral-200 rounded animate-pulse" />
              <div className="h-8 w-24 bg-neutral-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
