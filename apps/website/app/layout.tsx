import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ibimina - SACCO Management Platform",
    template: "%s | Ibimina",
  },
  description:
    "Comprehensive SACCO management platform for Rwanda's Umurenge SACCOs. Manage group savings (ikimina), member accounts, and mobile money payments.",
  keywords: [
    "SACCO",
    "Rwanda",
    "Umurenge",
    "Ibimina",
    "Savings",
    "Credit Cooperative",
    "Mobile Money",
    "Financial Management",
  ],
  authors: [{ name: "SACCO+" }],
  openGraph: {
    type: "website",
    locale: "en_RW",
    url: "https://ibimina.rw",
    siteName: "Ibimina",
    title: "Ibimina - SACCO Management Platform",
    description: "Comprehensive SACCO management platform for Rwanda's Umurenge SACCOs.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ibimina SACCO Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ibimina - SACCO Management Platform",
    description: "Comprehensive SACCO management platform for Rwanda's Umurenge SACCOs.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
