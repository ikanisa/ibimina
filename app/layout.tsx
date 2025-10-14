import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";
import { headers, cookies } from "next/headers";
import { resolveRequestLocale } from "@/lib/i18n/resolve-locale";

export const metadata: Metadata = {
  title: "Ibimina Staff Console",
  description: "Staff-only platform for Umurenge SACCO Ibimina operations.",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0b1020",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const cookieStore = await cookies();
  const nonce = headerList.get("x-csp-nonce") ?? undefined;
  const locale = resolveRequestLocale({ headers: headerList, cookies: cookieStore });

  return (
    <html lang={locale} className="bg-nyungwe" suppressHydrationWarning>
      <body className="antialiased bg-nyungwe text-neutral-0">
        <AppProviders nonce={nonce} locale={locale}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
