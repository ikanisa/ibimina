/**
 * Root Layout for SACCO+ Client App
 *
 * This layout wraps all pages and provides:
 * - Global styles and CSS reset
 * - Semantic HTML structure for accessibility
 * - Meta tags for SEO and PWA support
 * - Language attribute for screen readers
 * - Bottom navigation for main app routes
 *
 * Accessibility features:
 * - lang attribute on html element
 * - Semantic viewport configuration
 * - Proper document title structure
 * - Skip to main content link
 */

import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/ui/bottom-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SACCO+ Client App",
    template: "%s | SACCO+ Client",
  },
  description: "Mobile banking for Umurenge SACCO members - Manage your ibimina savings",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SACCO+ Client",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0b1020",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        {/* Skip to main content link for keyboard navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          Skip to main content
        </a>

        {/* Main content */}
        <div id="main-content">{children}</div>

        {/* Bottom Navigation - conditionally rendered */}
        <BottomNav />
      </body>
    </html>
  );
}
