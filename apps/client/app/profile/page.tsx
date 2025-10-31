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
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-br from-atlas-blue via-atlas-blue-light to-atlas-blue-dark px-4 py-8 text-white">
        <div className="mx-auto max-w-screen-xl">
          <h1 className="mb-2 text-3xl font-bold">{profile.name}</h1>
          <p className="text-sm text-white/90">
            Member since {new Date(profile.createdAt).toLocaleDateString()}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl space-y-6 px-4 py-6">
        {/* Reference Card */}
        <section aria-labelledby="reference-heading">
          <h2 id="reference-heading" className="mb-4 text-lg font-bold text-neutral-900">
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
          className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6"
        >
          <h2 id="contact-heading" className="text-lg font-bold text-neutral-900">
            Contact Information
          </h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MessageCircle
                className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-700">WhatsApp</p>
                <p className="mt-1 text-base font-semibold text-neutral-900">
                  {profile.whatsappMsisdn}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  This number is used for notifications and communication
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="mt-1 h-5 w-5 flex-shrink-0 text-atlas-blue" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-700">Mobile Money</p>
                <p className="mt-1 text-base font-semibold text-neutral-900">{profile.momoMsisdn}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  This number is linked to your payment account
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-4">
            <p className="text-xs text-neutral-600">
              To update your contact information, please contact your SACCO staff.
            </p>
          </div>
        </section>

        {/* Language Settings */}
        <section
          aria-labelledby="language-heading"
          className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6"
        >
          <h2
            id="language-heading"
            className="flex items-center gap-2 text-lg font-bold text-neutral-900"
          >
            <Globe className="h-5 w-5 text-atlas-blue" aria-hidden="true" />
            <span>Language / Ururimi / Langue</span>
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              className={`
                min-h-[56px] rounded-xl border-2 px-4 py-3 font-semibold transition-all duration-interactive
                focus:outline-none focus:ring-2 focus:ring-atlas-blue/30 focus:ring-offset-2
                ${
                  profile.lang === "rw"
                    ? "border-atlas-blue bg-atlas-glow text-atlas-blue-dark"
                    : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                }
              `}
              aria-pressed={profile.lang === "rw"}
            >
              Kinyarwanda
            </button>
            <button
              className={`
                min-h-[56px] rounded-xl border-2 px-4 py-3 font-semibold transition-all duration-interactive
                focus:outline-none focus:ring-2 focus:ring-atlas-blue/30 focus:ring-offset-2
                ${
                  profile.lang === "en"
                    ? "border-atlas-blue bg-atlas-glow text-atlas-blue-dark"
                    : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                }
              `}
              aria-pressed={profile.lang === "en"}
            >
              English
            </button>
            <button
              className={`
                min-h-[56px] rounded-xl border-2 px-4 py-3 font-semibold transition-all duration-interactive
                focus:outline-none focus:ring-2 focus:ring-atlas-blue/30 focus:ring-offset-2
                ${
                  profile.lang === "fr"
                    ? "border-atlas-blue bg-atlas-glow text-atlas-blue-dark"
                    : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                }
              `}
              aria-pressed={profile.lang === "fr"}
            >
              Français
            </button>
          </div>

          <p className="text-xs text-neutral-600">
            Choose your preferred language for the app interface
          </p>
        </section>

        {/* Help & Support */}
        <section
          aria-labelledby="help-heading"
          className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6"
        >
          <h2 id="help-heading" className="flex items-center gap-2 text-lg font-bold text-neutral-900">
            <HelpCircle className="h-5 w-5 text-atlas-blue" aria-hidden="true" />
            <span>Help & Support</span>
          </h2>

          <div className="space-y-3">
            <a
              href="/help"
              className="flex min-h-[56px] items-center justify-between rounded-xl bg-neutral-50 px-4 py-3 transition-colors duration-interactive hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-atlas-blue/30 focus:ring-offset-2"
            >
              <span className="font-medium text-neutral-900">How to Use USSD Payments</span>
              <svg
                className="h-5 w-5 text-neutral-400"
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
              className="flex min-h-[56px] items-center justify-between rounded-xl bg-neutral-50 px-4 py-3 transition-colors duration-interactive hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-atlas-blue/30 focus:ring-offset-2"
            >
              <span className="font-medium text-neutral-900">Frequently Asked Questions</span>
              <svg
                className="h-5 w-5 text-neutral-400"
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
              className="flex min-h-[56px] items-center justify-between rounded-xl bg-neutral-50 px-4 py-3 transition-colors duration-interactive hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-atlas-blue/30 focus:ring-offset-2"
            >
              <span className="font-medium text-neutral-900">Contact SACCO Staff</span>
              <svg
                className="h-5 w-5 text-neutral-400"
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
          className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6"
        >
          <h2
            id="legal-heading"
            className="flex items-center gap-2 text-lg font-bold text-neutral-900"
          >
            <Shield className="h-5 w-5 text-atlas-blue" aria-hidden="true" />
            <span>Legal & Privacy</span>
          </h2>

          <div className="space-y-3">
            <a
              href="/terms"
              className="flex items-center gap-2 text-atlas-blue hover:text-atlas-blue-dark hover:underline"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm font-medium">Terms of Service</span>
            </a>

            <a
              href="/privacy"
              className="flex items-center gap-2 text-atlas-blue hover:text-atlas-blue-dark hover:underline"
            >
              <Shield className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm font-medium">Privacy Policy</span>
            </a>
          </div>
        </section>

        {/* App Version */}
        <div className="pb-4 text-center text-xs text-neutral-500">
          <p>SACCO+ Client App v1.0.0</p>
          <p className="mt-1">© 2025 Ibimina. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
