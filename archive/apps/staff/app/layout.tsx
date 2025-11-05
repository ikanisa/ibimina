import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ibimina Staff Portal",
    template: "%s | Ibimina Staff",
  },
  description: "Operational console for SACCO+ field and branch teams.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-maskable.svg", type: "image/svg+xml", rel: "mask-icon" },
    ],
    apple: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icons/icon.svg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ibimina Staff",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1020",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const headerList = await headers();
  const nonce = headerList.get("x-csp-nonce") ?? undefined;

  return (
    <html lang="en" className="bg-slate-50" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased" data-csp-nonce={nonce}>
        {children}
      </body>
    </html>
  );
}
