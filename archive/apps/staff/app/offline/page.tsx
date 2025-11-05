import Link from "next/link";

export const metadata = {
  title: "Offline · Ibimina Staff",
  description: "You are offline. Cached operations remain accessible.",
};

export const dynamic = "force-static";

export default function OfflineFallback() {
  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 bg-slate-900 px-6 py-16 text-center text-white"
      role="main"
      aria-labelledby="offline-heading"
    >
      <div className="flex flex-col items-center gap-3">
        <span
          className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/70"
          role="status"
        >
          Offline mode
        </span>
        <h1 id="offline-heading" className="text-3xl font-semibold leading-tight">
          Connection lost
        </h1>
        <p className="text-sm text-white/80">
          Critical ibimina tools remain cached. Reconnect to sync reconciliations and approve member
          activity.
        </p>
      </div>

      <nav className="grid w-full gap-3 text-sm" aria-label="Offline navigation options">
        <Link
          href="/dashboard"
          className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-medium text-white transition hover:border-white/30 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Retry dashboard
        </Link>
        <Link
          href="/dashboard/tasks"
          className="rounded-2xl border border-white/10 bg-transparent px-5 py-3 text-white transition hover:border-white/25 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Review field tasks
        </Link>
        <Link
          href="/dashboard/reconciliation"
          className="rounded-2xl border border-white/10 bg-transparent px-5 py-3 text-white transition hover:border-white/25 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Check reconciliation queue
        </Link>
      </nav>

      <p className="text-xs text-white/70">
        Need help? Call SACCO+ support or email
        <a
          href="mailto:support@ibimina.rw"
          className="ml-1 font-medium text-white underline focus:outline-none focus:ring-2 focus:ring-white/60 focus:rounded"
        >
          support@ibimina.rw
        </a>
        once you are back online.
      </p>
    </main>
  );
}
