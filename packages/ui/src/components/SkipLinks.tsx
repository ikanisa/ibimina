"use client";

/**
 * SkipLinks Component
 *
 * Provides keyboard shortcuts to skip to main content and navigation.
 * Required for WCAG AA accessibility compliance.
 * Links are visually hidden but appear on keyboard focus.
 *
 * @example
 * ```tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <SkipLinks />
 *         <nav id="main-navigation">...</nav>
 *         <main id="main-content">{children}</main>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="fixed top-4 left-4 z-[100] px-4 py-2 bg-primary text-primary-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
      >
        Skip to main content
      </a>
      <a
        href="#main-navigation"
        className="fixed top-4 left-48 z-[100] px-4 py-2 bg-primary text-primary-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
      >
        Skip to navigation
      </a>
    </div>
  );
}
