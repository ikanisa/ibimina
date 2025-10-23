import Link from "next/link";

export const metadata = {
  title: "Offline · SACCO+",
  description: "You are offline. Reconnect to continue managing ibimina.",
};

export const dynamic = "force-static";

export default function OfflineFallback() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 bg-nyungwe px-6 py-16 text-center text-neutral-0">
      <div className="flex flex-col items-center gap-3">
        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-neutral-2">
          Offline mode
        </span>
        <h1 className="text-3xl font-semibold leading-tight">No internet connection</h1>
        <p className="text-sm text-neutral-300">
          SACCO+ works best online. Reconnect to resume reconciling statements, approving contributions, or managing ikimina groups.
        </p>
      </div>

      <div className="grid w-full gap-3 text-sm">
        <Link
          href="/dashboard"
          className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-medium text-neutral-0 transition hover:border-white/25 hover:bg-white/20"
        >
          Retry dashboard
        </Link>
        <Link
          href="/ikimina"
          className="rounded-2xl border border-white/10 bg-transparent px-5 py-3 text-neutral-0 transition hover:border-white/25 hover:bg-white/10"
        >
          Review ikimina roster
        </Link>
        <Link
          href="/recon"
          className="rounded-2xl border border-white/10 bg-transparent px-5 py-3 text-neutral-0 transition hover:border-white/25 hover:bg-white/10"
        >
          Go to reconciliation queue
        </Link>
      </div>

      <p className="text-xs text-neutral-400">
        Need help? Call SACCO+ support or email <span className="font-medium text-neutral-0">support@ibimina.rw</span> once you are back online.
      </p>
    </main>
  );
}
