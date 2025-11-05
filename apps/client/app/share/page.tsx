import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shared content - Ibimina",
  description: "Review content shared into Ibimina before taking action.",
};

type SharePageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

const normalise = (value: string | string[] | undefined) => {
  if (!value) return null;
  if (Array.isArray(value)) {
    return normalise(value[0]);
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export default function SharePage({ searchParams }: SharePageProps) {
  const title = normalise(searchParams.title);
  const text = normalise(searchParams.text);
  const url = normalise(searchParams.url);

  const summary = [title, text, url].filter(Boolean);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-16 dark:bg-neutral-900">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-xl ring-1 ring-neutral-200 dark:bg-neutral-800 dark:ring-neutral-700">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
          Shared to Ibimina
        </h1>
        <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
          Content shared into the Ibimina PWA is kept on your device until you choose an action.
        </p>

        <div className="mt-6 space-y-4 text-neutral-800 dark:text-neutral-200">
          {summary.length === 0 ? (
            <p>No content was provided with this share action.</p>
          ) : (
            <ul className="list-disc space-y-2 pl-5">
              {title ? (
                <li>
                  <strong>Title:</strong> {title}
                </li>
              ) : null}
              {text ? (
                <li>
                  <strong>Message:</strong> {text}
                </li>
              ) : null}
              {url ? (
                <li>
                  <strong>Link:</strong>{" "}
                  <a
                    className="text-atlas-blue underline"
                    href={url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {url}
                  </a>
                </li>
              ) : null}
            </ul>
          )}
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-2">
          <Link
            prefetch
            href="/chat"
            className="inline-flex items-center justify-center rounded-xl bg-atlas-blue px-4 py-3 text-center text-sm font-semibold text-white shadow-atlas transition hover:bg-atlas-blue-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-blue"
          >
            Ask the AI to help
          </Link>
          <Link
            prefetch
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-neutral-200 px-4 py-3 text-center text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-700"
          >
            Go to dashboard
          </Link>
        </div>

        <p className="mt-6 text-xs text-neutral-700 dark:text-neutral-400">
          Shared data stays on this device and is cleared after you navigate away from this page.
        </p>
      </div>
    </main>
  );
}
