"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import { logError } from "@/lib/observability/logger";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  logError("global_error", { error });

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 bg-nyungwe p-6 text-neutral-0">
        <div
          className="glass rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur"
          role="alert"
          aria-live="assertive"
        >
          <div className="mb-4 flex justify-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <AlertTriangle className="h-8 w-8 text-red-400" aria-hidden />
            </div>
          </div>
          <h1 className="mb-3 text-center text-xl font-semibold">Application Error</h1>
          <p className="mx-auto mb-6 max-w-md text-center text-sm leading-relaxed text-neutral-2">
            An unexpected error occurred while loading the application. Please try refreshing the
            page. If the problem persists, contact support.
          </p>
          {error.digest && (
            <p className="mb-6 rounded-lg bg-white/5 px-3 py-2 text-center font-mono text-xs text-neutral-3">
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="interactive-scale inline-flex items-center justify-center gap-2 rounded-full bg-kigali px-6 py-3 text-sm font-semibold text-ink transition hover:bg-kigali/90 focus:outline-none focus:ring-2 focus:ring-kigali focus:ring-offset-2 focus:ring-offset-nyungwe"
            >
              <RefreshCcw className="h-4 w-4" aria-hidden />
              Retry
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
