'use client';

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[app/error.tsx] segment error", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-lg font-semibold text-neutral-0">Something went wrong.</h2>
      <p className="max-w-sm text-sm text-neutral-3">
        Try the request again or head back to the dashboard. If the problem persists, capture the error digest from the console and share it with the team.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Try again
      </button>
    </div>
  );
}
