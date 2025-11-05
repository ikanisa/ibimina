import { CardSkeleton } from "@ibimina/ui";

export default function GroupsLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <header className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4 py-8 space-y-3">
          <div className="h-9 w-56 bg-neutral-200 rounded animate-pulse" />
          <div className="h-5 w-96 bg-neutral-200 rounded animate-pulse" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <li key={i}>
              <CardSkeleton className="h-80" />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
