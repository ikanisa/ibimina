import Link from "next/link";
import type { Metadata } from "next";

type SharePageProps = {
  searchParams: {
    title?: string;
    text?: string;
    url?: string;
  };
};

export const metadata: Metadata = {
  title: "Shared with Ibimina",
  description: "Review and confirm content that was shared with the Ibimina app.",
};

export default function SharePage({ searchParams }: SharePageProps) {
  const { title, text, url } = searchParams;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Share target
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Review shared content
        </h1>
        <p className="text-base text-muted-foreground">
          This page is used when another application shares information into Ibimina. Confirm the
          details below and continue to the relevant feature.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Title</dt>
            <dd className="mt-1 text-base text-foreground">{title ?? "(No title provided)"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Message</dt>
            <dd className="mt-1 text-base text-foreground">{text ?? "(No message provided)"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Link</dt>
            <dd className="mt-1 text-base text-foreground">
              {url ? (
                <Link href={url} className="underline underline-offset-4">
                  {url}
                </Link>
              ) : (
                "(No link provided)"
              )}
            </dd>
          </div>
        </dl>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          Go to dashboard
        </Link>
        <Link
          href="/support"
          className="inline-flex items-center justify-center rounded-lg border border-input px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
        >
          Contact support
        </Link>
      </div>
    </main>
  );
}
