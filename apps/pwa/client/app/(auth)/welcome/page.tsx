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
import { Check } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="mx-auto max-w-lg space-y-8">
      {/* Main heading - WCAG Level AAA: Clear, descriptive page title */}
      <header className="space-y-4 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-atlas-blue to-atlas-blue-dark shadow-atlas">
          <svg
            className="h-10 w-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-neutral-900">Welcome to SACCO+</h1>
        <p className="text-lg text-neutral-700">Your mobile banking companion for Umurenge SACCO</p>
      </header>

      {/* Feature list - using semantic list element for screen readers */}
      <section className="space-y-4" aria-label="Key features">
        <h2 className="text-xl font-semibold text-neutral-900">What you can do:</h2>
        <ul className="space-y-4">
          <li className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-interactive hover:shadow-atlas">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            </div>
            <span className="text-neutral-700">Access your SACCO account anytime, anywhere</span>
          </li>
          <li className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-interactive hover:shadow-atlas">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            </div>
            <span className="text-neutral-700">Make secure mobile money transactions</span>
          </li>
          <li className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-interactive hover:shadow-atlas">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            </div>
            <span className="text-neutral-700">Track your savings and contributions</span>
          </li>
          <li className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-interactive hover:shadow-atlas">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            </div>
            <span className="text-neutral-700">Join and manage group savings (Ikimina)</span>
          </li>
        </ul>
      </section>

      {/* Call to action with accessible button */}
      <div className="space-y-4 pt-4">
        <Link
          href="/onboard"
          className="inline-block w-full rounded-xl bg-atlas-blue px-6 py-4 text-center text-lg font-semibold text-white shadow-atlas transition-all duration-interactive hover:bg-atlas-blue-dark hover:shadow-lg focus-visible:ring-4 focus-visible:ring-atlas-blue focus-visible:ring-opacity-50"
        >
          Get Started
        </Link>

        {/* Additional help text with appropriate semantic markup */}
        <p className="text-center text-sm text-neutral-700">
          Already have an account?{" "}
          <a
            href="/login"
            className="rounded font-medium text-atlas-blue underline transition-colors duration-interactive hover:text-atlas-blue-dark focus-visible:ring-2 focus-visible:ring-atlas-blue focus-visible:ring-opacity-50"
          >
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
}
