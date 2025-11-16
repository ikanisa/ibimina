"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[client] segment error", error);
  }, [error]);

  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-neutral-50 p-6 text-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-8 shadow-xl">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-500" aria-hidden />
        </div>
        <h2 className="mb-3 text-xl font-semibold text-neutral-900">Sorry, we hit a snag</h2>
        <p className="mx-auto mb-2 max-w-md text-sm leading-relaxed text-neutral-700">
          We couldn’t finish loading this page. Your information is still safe.
        </p>
        <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-neutral-700">
          Please try again, or go back to your dashboard to continue where things were working.
        </p>
        {error.digest && (
          <p className="mb-6 rounded-lg bg-neutral-100 px-3 py-2 font-mono text-xs text-neutral-700">
            Support code: {error.digest}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-atlas-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-atlas-blue/90 focus:outline-none focus:ring-2 focus:ring-atlas-blue focus:ring-offset-2"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden />
            Try again
          </button>
          <Link
            href="/home"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-atlas-blue focus:ring-offset-2"
          >
            <Home className="h-4 w-4" aria-hidden />
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
