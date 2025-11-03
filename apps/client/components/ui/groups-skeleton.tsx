/**
 * Groups Page Skeleton Loader
 * Displays loading skeletons while groups data is being fetched
 */

export function GroupsSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20 animate-pulse">
      {/* Page header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4 py-8">
          <div className="h-9 bg-neutral-200 rounded w-48 mb-2" />
          <div className="h-5 bg-neutral-200 rounded w-96" />
        </div>
      </header>

      {/* Groups grid skeleton */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <article
              key={i}
              className="flex flex-col w-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              {/* Group header */}
              <div className="mb-5">
                <div className="h-6 bg-neutral-200 rounded w-40 mb-1.5" />
                <div className="h-4 bg-neutral-200 rounded w-24" />
              </div>

              {/* Group metadata */}
              <div className="space-y-3 mb-6 flex-grow">
                <div className="flex items-center gap-2.5">
                  <div className="h-4 w-4 bg-neutral-200 rounded" />
                  <div className="h-4 bg-neutral-200 rounded w-24" />
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-4 w-4 bg-neutral-200 rounded" />
                  <div className="h-4 bg-neutral-200 rounded w-28" />
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-4 w-4 bg-neutral-200 rounded" />
                  <div className="h-4 bg-neutral-200 rounded w-32" />
                </div>
                <div className="pt-2">
                  <div className="h-6 bg-neutral-200 rounded-full w-20" />
                </div>
              </div>

              {/* Action button */}
              <div className="h-10 bg-neutral-200 rounded-xl w-full" />
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
