"use client";

import Link from "next/link";
import { WifiOff } from "lucide-react";

export function OfflinePageClient() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 px-4 dark:from-neutral-900 dark:to-neutral-800">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-atlas dark:border-neutral-700 dark:bg-neutral-800">
        <div className="mb-6">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-800">
            <WifiOff
              className="h-12 w-12 text-neutral-700 dark:text-neutral-400"
              aria-hidden="true"
            />
          </div>
        </div>

        <h1 className="mb-4 text-3xl font-bold text-neutral-900 dark:text-white">
          You&apos;re Offline
        </h1>

        <p className="mb-8 text-neutral-700 dark:text-neutral-400">
          It looks like you&apos;ve lost your internet connection. Some features may be unavailable
          until you reconnect.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-xl bg-atlas-blue px-6 py-3 font-medium text-white shadow-atlas transition-all duration-interactive hover:bg-atlas-blue-dark hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-atlas-blue focus:ring-opacity-50"
          >
            Try Again
          </button>

          <button
            onClick={() => window.history.back()}
            className="w-full rounded-xl bg-neutral-100 px-6 py-3 font-medium text-neutral-800 transition-all duration-interactive hover:bg-neutral-200 focus:outline-none focus:ring-4 focus:ring-neutral-300 focus:ring-opacity-50 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
          >
            Go Back
          </button>

          <Link
            href="/"
            className="block w-full rounded-xl py-3 font-medium text-atlas-blue transition-colors duration-interactive hover:text-atlas-blue-dark focus:outline-none focus:ring-4 focus:ring-atlas-blue focus:ring-opacity-50 dark:text-atlas-blue-light dark:hover:text-atlas-blue"
          >
            Return to Home
          </Link>
        </div>

        <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-700">
          <p className="text-sm text-neutral-700 dark:text-neutral-400">
            Cached pages may still be available while offline
          </p>
        </div>
      </div>
    </div>
  );
}
