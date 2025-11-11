import { CardSkeleton } from "@ibimina/ui";

export default function PayLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-2">
          <div className="h-8 w-48 bg-neutral-200 rounded animate-pulse" />
          <div className="h-4 w-96 bg-neutral-200 rounded animate-pulse" />
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-8">
        {/* Info banner skeleton */}
        <div className="bg-info-50 border border-info-200 rounded-2xl p-5 h-24 animate-pulse" />

        {/* Payment cards skeleton */}
        <div className="space-y-6">
          <CardSkeleton className="h-64" />
          <CardSkeleton className="h-64" />
          <CardSkeleton className="h-64" />
        </div>
      </main>
    </div>
  );
}
