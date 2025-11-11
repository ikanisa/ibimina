import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | SACCO+ Client",
  description: "How we protect your data",
};

export default function PrivacyPage() {
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
          <h1 className="mt-4 text-2xl font-bold text-neutral-900">Privacy Policy</h1>
          <p className="mt-1 text-sm text-neutral-700">Last updated: October 31, 2025</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <section className="prose prose-neutral max-w-none">
            <h2 className="text-xl font-bold text-neutral-900">1. Information We Collect</h2>
            <p className="text-neutral-700">We collect the following information:</p>
            <ul className="list-disc pl-6 text-neutral-700">
              <li>WhatsApp and mobile money phone numbers</li>
              <li>Group membership information</li>
              <li>Transaction history</li>
              <li>Device information for security purposes</li>
            </ul>

            <h2 className="mt-6 text-xl font-bold text-neutral-900">
              2. How We Use Your Information
            </h2>
            <p className="text-neutral-700">Your information is used to:</p>
            <ul className="list-disc pl-6 text-neutral-700">
              <li>Process payments and transactions</li>
              <li>Send payment confirmations via WhatsApp</li>
              <li>Provide customer support</li>
              <li>Improve our services</li>
              <li>Comply with legal and regulatory requirements</li>
            </ul>

            <h2 className="mt-6 text-xl font-bold text-neutral-900">3. Data Security</h2>
            <p className="text-neutral-700">
              We implement industry-standard security measures to protect your data, including
              encryption, secure server storage, and regular security audits.
            </p>

            <h2 className="mt-6 text-xl font-bold text-neutral-900">4. Data Sharing</h2>
            <p className="text-neutral-700">
              We do not sell your personal information. We only share data with:
            </p>
            <ul className="list-disc pl-6 text-neutral-700">
              <li>Your SACCO for account management</li>
              <li>Mobile money operators for payment processing</li>
              <li>Law enforcement when legally required</li>
            </ul>

            <h2 className="mt-6 text-xl font-bold text-neutral-900">5. Your Rights</h2>
            <p className="text-neutral-700">You have the right to:</p>
            <ul className="list-disc pl-6 text-neutral-700">
              <li>Access your personal data</li>
              <li>Request data correction</li>
              <li>Request data deletion (subject to legal retention requirements)</li>
              <li>Opt-out of non-essential communications</li>
            </ul>

            <h2 className="mt-6 text-xl font-bold text-neutral-900">6. Contact Us</h2>
            <p className="text-neutral-700">
              For privacy-related questions or to exercise your rights, contact us at{" "}
              <a href="mailto:privacy@ibimina.rw" className="text-atlas-blue hover:underline">
                privacy@ibimina.rw
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
