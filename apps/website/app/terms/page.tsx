import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of service for Ibimina platform",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-primary-600">
              Ibimina
            </Link>
            <Link
              href="/"
              className="inline-flex items-center text-gray-700 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">Last updated: January 2025</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-700 mb-6">
            By accessing and using Ibimina, you accept and agree to be bound by these Terms of
            Service. If you do not agree to these terms, please do not use our services.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
          <p className="text-gray-700 mb-6">
            Ibimina provides a SACCO management platform that enables Umurenge SACCOs to manage
            group savings, member accounts, and mobile money transactions. The service is provided
            &quot;as is&quot; and we reserve the right to modify or discontinue the service at any
            time.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. User Responsibilities</h2>
          <p className="text-gray-700 mb-4">As a user of Ibimina, you agree to:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Use the service only for lawful purposes</li>
            <li>Not attempt to gain unauthorized access to the system</li>
            <li>Comply with all applicable laws and regulations</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Data and Privacy</h2>
          <p className="text-gray-700 mb-6">
            Your use of Ibimina is also governed by our Privacy Policy. We collect and process data
            as described in that policy, which is incorporated into these Terms by reference.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Limitation of Liability</h2>
          <p className="text-gray-700 mb-6">
            To the maximum extent permitted by law, Ibimina shall not be liable for any indirect,
            incidental, special, or consequential damages arising out of or relating to the use or
            inability to use the service.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Termination</h2>
          <p className="text-gray-700 mb-6">
            We reserve the right to suspend or terminate your access to the service at any time,
            with or without notice, for any violation of these Terms or for any other reason.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Changes to Terms</h2>
          <p className="text-gray-700 mb-6">
            We may update these Terms from time to time. We will notify you of any material changes
            by posting the new Terms on this page and updating the &quot;Last updated&quot; date.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Contact</h2>
          <p className="text-gray-700 mb-6">
            For questions about these Terms of Service, please contact us at legal@ibimina.rw
          </p>
        </div>
      </main>
    </div>
  );
}
