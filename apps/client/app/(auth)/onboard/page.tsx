/**
 * Onboarding Page for SACCO+ Client App
 *
 * This page presents the onboarding form where new users provide their
 * contact information (WhatsApp and Mobile Money numbers) to create
 * their member profile.
 *
 * The page implements WCAG 2.1 AA accessibility standards with:
 * - Clear heading hierarchy
 * - Descriptive page title and instructions
 * - Keyboard-accessible navigation
 * - High contrast text and interactive elements
 *
 * @page
 */

import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default function OnboardPage() {
  return (
    <div className="mx-auto max-w-md space-y-8">
      {/* Page header with descriptive content */}
      <header className="space-y-3 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-atlas-blue to-atlas-blue-dark shadow-atlas">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-neutral-900">Create Your Profile</h1>
        <p className="text-neutral-700">Please provide your contact information to get started</p>
      </header>

      {/* Onboarding form component */}
      <OnboardingForm />

      {/* Help text */}
      <footer className="pt-4 text-center">
        <p className="text-sm text-neutral-700">
          Need help?{" "}
          <a
            href="/help"
            className="rounded font-medium text-atlas-blue underline transition-colors duration-interactive hover:text-atlas-blue-dark focus-visible:ring-2 focus-visible:ring-atlas-blue focus-visible:ring-opacity-50"
          >
            Contact support
          </a>
        </p>
      </footer>
    </div>
  );
}
