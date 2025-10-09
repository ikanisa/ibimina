import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";

export const metadata: Metadata = {
  title: "Ibimina Staff Console",
  description: "Staff-only platform for Umurenge SACCO Ibimina operations.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0b1020",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="rw" className="bg-nyungwe" suppressHydrationWarning>
      <body className="antialiased bg-nyungwe text-neutral-0">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
