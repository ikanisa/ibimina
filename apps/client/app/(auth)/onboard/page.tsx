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
    <div className="space-y-6">
      {/* Page header with descriptive content */}
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-neutral-0">Create Your Profile</h1>
        <p className="text-sm text-neutral-1">
          Please provide your contact information to get started
        </p>
      </header>

      {/* Onboarding form component */}
      <OnboardingForm />

      {/* Help text */}
      <footer className="pt-4 text-center">
        <p className="text-xs text-neutral-2">
          Need help?{" "}
          <a
            href="/help"
            className="text-rw-blue underline hover:text-opacity-80 focus-visible:ring-2 focus-visible:ring-rw-blue focus-visible:ring-opacity-50 rounded"
          >
            Contact support
          </a>
        </p>
      </footer>
    </div>
  );
}
