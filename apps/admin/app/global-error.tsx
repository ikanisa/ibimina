"use client";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  console.error("[app/global-error.tsx] unhandled app error", error);

  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-nyungwe text-neutral-0">
        <h2 className="text-xl font-semibold">App error</h2>
        <p className="max-w-md text-center text-sm text-neutral-3">
          We hit an unexpected failure while rendering this page. Refresh to retry the request. If
          you continue to see this screen, note the error digest from the console and contact
          support.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Retry
        </button>
      </body>
    </html>
  );
}
