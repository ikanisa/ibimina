/**
 * Profile Page
 *
 * Displays user profile with WhatsApp and Mobile Money numbers (read-only),
 * language toggle, help resources, and contact information.
 *
 * Features:
 * - WhatsApp and MoMo numbers (read-only display)
 * - Language toggle (Kinyarwanda, English, French)
 * - Help and FAQ access
 * - Contact SACCO staff
 * - Terms & Privacy links
 * - Theme toggle (optional)
 */

import { Phone, MessageCircle, Globe, HelpCircle, FileText, Shield } from "lucide-react";
import { ReferenceCard } from "@/components/reference/reference-card";

export const metadata = {
  title: "Profile | SACCO+ Client",
  description: "Your profile and settings",
};

// Mock data - replace with actual user data from Supabase
async function getUserProfile() {
  // TODO: Fetch from members_app_profiles table
  return {
    id: "user-1",
    name: "John Doe",
    whatsappMsisdn: "+250788123456",
    momoMsisdn: "+250788123456",
    lang: "en",
    referenceToken: "NYA.GAS.KBG.001",
    isVerified: true,
    createdAt: "2025-10-01T00:00:00Z",
  };
}

export default async function ProfilePage() {
  const profile = await getUserProfile();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-8">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
          <p className="text-blue-100 text-sm">
            Member since {new Date(profile.createdAt).toLocaleDateString()}
          </p>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Reference Card */}
        <section aria-labelledby="reference-heading">
          <h2 id="reference-heading" className="text-lg font-bold text-gray-900 mb-4">
            My Reference Code
          </h2>
          <ReferenceCard
            reference={profile.referenceToken}
            memberName={profile.name}
            showQR={true}
          />
        </section>

        {/* Contact Information (Read-Only) */}
        <section
          aria-labelledby="contact-heading"
          className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
        >
          <h2 id="contact-heading" className="text-lg font-bold text-gray-900">
            Contact Information
          </h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MessageCircle
                className="w-5 h-5 text-green-600 flex-shrink-0 mt-1"
                aria-hidden="true"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">WhatsApp</p>
                <p className="text-base font-semibold text-gray-900 mt-1">
                  {profile.whatsappMsisdn}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  This number is used for notifications and communication
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Mobile Money</p>
                <p className="text-base font-semibold text-gray-900 mt-1">{profile.momoMsisdn}</p>
                <p className="text-xs text-gray-500 mt-1">
                  This number is linked to your payment account
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              To update your contact information, please contact your SACCO staff.
            </p>
          </div>
        </section>

        {/* Language Settings */}
        <section
          aria-labelledby="language-heading"
          className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
        >
          <h2
            id="language-heading"
            className="text-lg font-bold text-gray-900 flex items-center gap-2"
          >
            <Globe className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <span>Language / Ururimi / Langue</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              className={`
                min-h-[56px] px-4 py-3 rounded-lg border-2 font-semibold transition-all
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${
                  profile.lang === "rw"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }
              `}
              aria-pressed={profile.lang === "rw"}
            >
              Kinyarwanda
            </button>
            <button
              className={`
                min-h-[56px] px-4 py-3 rounded-lg border-2 font-semibold transition-all
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${
                  profile.lang === "en"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }
              `}
              aria-pressed={profile.lang === "en"}
            >
              English
            </button>
            <button
              className={`
                min-h-[56px] px-4 py-3 rounded-lg border-2 font-semibold transition-all
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${
                  profile.lang === "fr"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }
              `}
              aria-pressed={profile.lang === "fr"}
            >
              Français
            </button>
          </div>

          <p className="text-xs text-gray-600">
            Choose your preferred language for the app interface
          </p>
        </section>

        {/* Help & Support */}
        <section
          aria-labelledby="help-heading"
          className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
        >
          <h2 id="help-heading" className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <span>Help & Support</span>
          </h2>

          <div className="space-y-3">
            <a
              href="/help"
              className="flex items-center justify-between min-h-[56px] px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span className="font-medium text-gray-900">How to Use USSD Payments</span>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>

            <a
              href="/help/faq"
              className="flex items-center justify-between min-h-[56px] px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span className="font-medium text-gray-900">Frequently Asked Questions</span>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>

            <a
              href="/help/contact"
              className="flex items-center justify-between min-h-[56px] px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span className="font-medium text-gray-900">Contact SACCO Staff</span>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>
        </section>

        {/* Legal Links */}
        <section
          aria-labelledby="legal-heading"
          className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
        >
          <h2
            id="legal-heading"
            className="text-lg font-bold text-gray-900 flex items-center gap-2"
          >
            <Shield className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <span>Legal & Privacy</span>
          </h2>

          <div className="space-y-3">
            <a
              href="/terms"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline"
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm font-medium">Terms of Service</span>
            </a>

            <a
              href="/privacy"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline"
            >
              <Shield className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm font-medium">Privacy Policy</span>
            </a>
          </div>
        </section>

        {/* App Version */}
        <div className="text-center text-xs text-gray-500 pb-4">
          <p>SACCO+ Client App v1.0.0</p>
          <p className="mt-1">© 2025 Ibimina. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
