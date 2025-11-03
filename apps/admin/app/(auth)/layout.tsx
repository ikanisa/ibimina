import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ibimina Staff — Sign in",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[color:var(--color-canvas,#05080f)] p-6 text-[color:var(--color-foreground,#f5f7fb)] transition-colors duration-300 bg-nyungwe text-neutral-0">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-6 focus:z-50 focus:rounded-full focus:bg-[color:var(--color-primary-500,#4a70ff)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[color:var(--color-foreground-inverse,#0d1324)] focus:bg-kigali text-ink"
      >
        Skip to content · Siga ujye ku bikorwa
      </a>
      <div
        data-glass
        className="glass w-full max-w-md rounded-2xl bg-[color:var(--color-surface,rgba(255,255,255,0.95))] p-6 text-[color:var(--color-foreground,#111827)] shadow-glass transition-colors duration-300 bg-white/95 text-gray-900"
      >
        {children}
      </div>
    </div>
  );
}
