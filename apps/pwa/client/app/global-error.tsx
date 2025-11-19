"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  console.error("[client] unhandled app error", error);

  return (
    <html lang="en" className="bg-neutral-50">
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-neutral-900">
        <div
          className="w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-xl"
          role="alert"
          aria-live="assertive"
        >
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-500" aria-hidden />
          </div>
          <h1 className="mb-3 text-xl font-semibold">We couldn’t load this page</h1>
          <p className="mx-auto mb-2 max-w-md text-sm leading-relaxed text-neutral-700">
            Something interrupted SACCO+. Your data is safe and nothing was submitted.
          </p>
          <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-neutral-700">
            Refresh to try again. If this keeps happening, share the code below with support so we
            can get you unstuck.
          </p>
          {error.digest && (
            <p className="mb-6 rounded-lg bg-neutral-100 px-3 py-2 font-mono text-xs text-neutral-700">
              Support code: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-atlas-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-atlas-blue/90 focus:outline-none focus:ring-2 focus:ring-atlas-blue focus:ring-offset-2"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden />
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
