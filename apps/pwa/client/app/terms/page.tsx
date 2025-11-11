import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service | SACCO+ Client",
  description: "Terms and conditions",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <header className="bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-screen-xl px-4 py-4">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-atlas-blue hover:text-atlas-blue-dark transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Profile</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-neutral-900">Terms of Service</h1>
          <p className="mt-1 text-sm text-neutral-700">Last updated: October 31, 2025</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <section className="prose prose-neutral max-w-none">
            <h2 className="text-xl font-bold text-neutral-900">1. Acceptance of Terms</h2>
            <p className="text-neutral-700">
              By accessing and using the SACCO+ mobile application, you accept and agree to be bound
              by these Terms of Service and our Privacy Policy.
            </p>

            <h2 className="mt-6 text-xl font-bold text-neutral-900">2. Service Description</h2>
            <p className="text-neutral-700">
              SACCO+ is a mobile banking platform that enables members to manage their savings group
              (Ibimina) accounts, make payments, and access financial services provided by partner
              SACCOs.
            </p>

            <h2 className="mt-6 text-xl font-bold text-neutral-900">3. User Responsibilities</h2>
            <p className="text-neutral-700">You agree to:</p>
            <ul className="list-disc pl-6 text-neutral-700">
              <li>Provide accurate and current information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use</li>
              <li>Use the service in compliance with all applicable laws</li>
            </ul>

            <h2 className="mt-6 text-xl font-bold text-neutral-900">4. Payment Services</h2>
            <p className="text-neutral-700">
              Payment processing is facilitated through third-party mobile money operators. We are
              not responsible for delays or failures in payment processing caused by these
              third-party providers.
            </p>

            <h2 className="mt-6 text-xl font-bold text-neutral-900">5. Limitation of Liability</h2>
            <p className="text-neutral-700">
              SACCO+ is provided &ldquo;as is&rdquo; without warranties of any kind. We are not
              liable for any indirect, incidental, or consequential damages arising from your use of
              the service.
            </p>

            <h2 className="mt-6 text-xl font-bold text-neutral-900">6. Contact Information</h2>
            <p className="text-neutral-700">
              For questions about these Terms, please contact us at{" "}
              <a href="mailto:legal@ibimina.rw" className="text-atlas-blue hover:underline">
                legal@ibimina.rw
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
