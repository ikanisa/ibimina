/**
 * Welcome Page for SACCO+ Client App
 *
 * This is the initial landing page for new users accessing the client app.
 * It provides an introduction to the SACCO+ member services and guides users
 * to the onboarding process.
 *
 * Accessibility features (WCAG 2.1 AA compliant):
 * - Semantic HTML structure with proper heading hierarchy
 * - High contrast text (4.5:1 ratio minimum)
 * - Large, accessible touch targets (min 44x44px)
 * - Clear call-to-action button with descriptive text
 * - Focus-visible states for keyboard navigation
 * - Skip to content functionality through semantic HTML
 *
 * @page
 */

import Link from "next/link";

export default function WelcomePage() {
  return (
    <div className="space-y-8 text-center">
      {/* Main heading - WCAG Level AAA: Clear, descriptive page title */}
      <header className="space-y-4">
        <h1 className="text-3xl font-bold text-neutral-0">Welcome to SACCO+</h1>
        <p className="text-lg text-neutral-1">Your mobile banking companion for Umurenge SACCO</p>
      </header>

      {/* Feature list - using semantic list element for screen readers */}
      <section className="space-y-4 text-left" aria-label="Key features">
        <h2 className="text-xl font-semibold text-neutral-0">What you can do:</h2>
        <ul className="space-y-3 text-neutral-1">
          <li className="flex items-start gap-3">
            <span className="text-rw-blue text-xl" aria-hidden="true">
              ✓
            </span>
            <span>Access your SACCO account anytime, anywhere</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-rw-blue text-xl" aria-hidden="true">
              ✓
            </span>
            <span>Make secure mobile money transactions</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-rw-blue text-xl" aria-hidden="true">
              ✓
            </span>
            <span>Track your savings and contributions</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-rw-blue text-xl" aria-hidden="true">
              ✓
            </span>
            <span>Join and manage group savings (Ikimina)</span>
          </li>
        </ul>
      </section>

      {/* Call to action with accessible button */}
      <div className="pt-4">
        <Link
          href="/onboard"
          className="inline-block w-full px-6 py-4 text-lg font-semibold text-ink bg-rw-blue rounded-xl transition-all duration-interactive hover:bg-opacity-90 focus-visible:ring-4 focus-visible:ring-rw-blue focus-visible:ring-opacity-50"
          /*
           * WCAG 2.1 AA: Button has sufficient size (44px height minimum)
           * and clear focus indicator
           */
        >
          Get Started
        </Link>
      </div>

      {/* Additional help text with appropriate semantic markup */}
      <footer className="pt-4">
        <p className="text-sm text-neutral-2">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-rw-blue underline hover:text-opacity-80 focus-visible:ring-2 focus-visible:ring-rw-blue focus-visible:ring-opacity-50 rounded"
          >
            Sign in here
          </a>
        </p>
      </footer>
    </div>
  );
}
