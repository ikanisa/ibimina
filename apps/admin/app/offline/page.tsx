import Link from "next/link";

/**
 * Offline Fallback Page
 * 
 * This page is shown when the user is offline and tries to navigate to a page
 * that is not cached. It provides a graceful offline experience.
 * 
 * WCAG 2.1 AA Compliance:
 * - Color contrast ratios meet AA standards (4.5:1 for normal text, 3:1 for large text)
 * - Focus indicators are visible and clear
 * - Semantic HTML with proper heading hierarchy
 * - Alternative navigation options provided
 * - Clear, descriptive link text
 */

export const metadata = {
  title: "Offline · SACCO+",
  description: "You are offline. Reconnect to continue managing ibimina.",
};

export const dynamic = "force-static";

export default function OfflineFallback() {
  return (
    <main 
      className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 bg-nyungwe px-6 py-16 text-center text-neutral-0"
      role="main"
      aria-labelledby="offline-heading"
    >
      <div className="flex flex-col items-center gap-3">
        <span 
          className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-neutral-2"
          role="status"
          aria-live="polite"
        >
          Offline mode
        </span>
        <h1 id="offline-heading" className="text-3xl font-semibold leading-tight">
          No internet connection
        </h1>
        <p className="text-sm text-neutral-300">
          SACCO+ works best online. Reconnect to resume reconciling statements, approving contributions, or managing ikimina groups.
        </p>
      </div>

      <nav className="grid w-full gap-3 text-sm" aria-label="Offline navigation options">
        <Link
          href="/dashboard"
          className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-medium text-neutral-0 transition hover:border-white/25 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-nyungwe"
        >
          Retry dashboard
        </Link>
        <Link
          href="/ikimina"
          className="rounded-2xl border border-white/10 bg-transparent px-5 py-3 text-neutral-0 transition hover:border-white/25 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-nyungwe"
        >
          Review ikimina roster
        </Link>
        <Link
          href="/recon"
          className="rounded-2xl border border-white/10 bg-transparent px-5 py-3 text-neutral-0 transition hover:border-white/25 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-nyungwe"
        >
          Go to reconciliation queue
        </Link>
      </nav>

      <p className="text-xs text-neutral-400">
        Need help? Call SACCO+ support or email{" "}
        <a 
          href="mailto:support@ibimina.rw" 
          className="font-medium text-neutral-0 underline focus:outline-none focus:ring-2 focus:ring-white/50 focus:rounded"
        >
          support@ibimina.rw
        </a>{" "}
        once you are back online.
      </p>
    </main>
  );
}
