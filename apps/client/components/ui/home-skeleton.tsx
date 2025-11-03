/**
 * Home Page Skeleton Loader
 * Displays loading skeletons while home dashboard data is being fetched
 * Prevents flash of empty content (P0 blocker H1.5)
 */

export function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20 animate-pulse">
      {/* Header skeleton */}
      <header className="relative bg-gradient-to-br from-atlas-blue via-atlas-blue-light to-atlas-blue-dark px-4 py-10">
        <div className="relative max-w-screen-xl mx-auto">
          <div className="h-9 bg-white/20 rounded-lg w-64 mb-2" />
          <div className="h-5 bg-white/15 rounded w-80" />
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Quick actions skeleton */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center min-h-[110px] p-5 bg-white border border-neutral-200 rounded-2xl"
              >
                <div className="w-7 h-7 bg-neutral-200 rounded-lg mb-2.5" />
                <div className="h-4 bg-neutral-200 rounded w-16" />
              </div>
            ))}
          </div>
        </section>

        {/* My Groups skeleton */}
        <section>
          <div className="h-7 bg-neutral-200 rounded w-32 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-2xl p-6">
                <div className="h-6 bg-neutral-200 rounded w-40 mb-4" />
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-neutral-200 rounded w-24" />
                    <div className="h-6 bg-neutral-200 rounded w-28" />
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-neutral-100">
                    <div className="h-4 bg-neutral-200 rounded w-16" />
                    <div className="h-4 bg-neutral-200 rounded w-8" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-neutral-200 rounded w-32" />
                    <div className="h-4 bg-neutral-200 rounded w-20" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-neutral-200 rounded w-28" />
                    <div className="h-4 bg-neutral-200 rounded w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent confirmations skeleton */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="h-7 bg-neutral-200 rounded w-44" />
            <div className="h-4 bg-neutral-200 rounded w-16" />
          </div>
          <div className="bg-white border border-neutral-200 rounded-2xl divide-y divide-neutral-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-32" />
                  <div className="h-3 bg-neutral-200 rounded w-24" />
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-4 bg-neutral-200 rounded w-24 ml-auto" />
                  <div className="h-5 bg-neutral-200 rounded-full w-20 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Insights skeleton */}
        <section className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="h-3 bg-neutral-200 rounded w-28 mb-2" />
              <div className="h-8 bg-neutral-200 rounded w-32" />
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
