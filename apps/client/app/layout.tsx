/**
 * Root Layout for SACCO+ Client App
 *
 * This layout wraps all pages and provides:
 * - Global styles and CSS reset
 * - Semantic HTML structure for accessibility
 * - Meta tags for SEO and PWA support
 * - Language attribute for screen readers
 *
 * Accessibility features:
 * - lang attribute on html element
 * - Semantic viewport configuration
 * - Proper document title structure
 */

import type { Metadata, Viewport } from "next";
import { FeatureFlagProvider } from "../components/FeatureFlagProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SACCO+ Member App",
  description: "Mobile banking for Umurenge SACCO members",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <FeatureFlagProvider>{children}</FeatureFlagProvider>
      </body>
    </html>
  );
}
