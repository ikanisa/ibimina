/**
 * Profile Page
 *
 * Displays user profile with contact details, language settings, and reference code.
 */

import { MessageCircle, Phone, Globe, HelpCircle, FileText, Shield } from "lucide-react";

import { ReferenceCard } from "@/components/reference/reference-card";
import { SmsConsentCard } from "@/components/sms/sms-consent-card";
import { loadProfile, updateLocaleAction } from "@/lib/data/profile";

const LANGUAGES = [
  { code: "rw", label: "Kinyarwanda" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

export const metadata = {
  title: "Profile | SACCO+ Client",
  description: "Your profile and settings",
};

export default async function ProfilePage() {
  const profile = await loadProfile();

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <header className="relative bg-gradient-to-br from-atlas-blue via-atlas-blue-light to-atlas-blue-dark px-4 py-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="relative mx-auto max-w-screen-xl">
          <h1 className="mb-2 text-3xl font-bold text-white drop-shadow-sm">
            {profile?.fullName ?? "Member"}
          </h1>
          {profile?.createdAt ? (
            <p className="text-sm text-white/80 drop-shadow-sm">
              Member since {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl space-y-6 px-4 py-6">
        {profile?.referenceToken ? (
          <section aria-labelledby="reference-heading">
            <h2 id="reference-heading" className="mb-4 text-lg font-bold text-neutral-900">
              My reference code
            </h2>
            <ReferenceCard
              reference={profile.referenceToken}
              memberName={profile.fullName ?? "Member"}
              showQR={true}
            />
          </section>
        ) : null}

        <section
          aria-labelledby="contact-heading"
          className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6"
        >
          <h2 id="contact-heading" className="text-lg font-bold text-neutral-900">
            Contact information
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
                  {profile?.whatsappMsisdn ?? "Not set"}
                </p>
                <p className="mt-1 text-xs text-neutral-700">
                  This number is used for notifications and communication.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="mt-1 h-5 w-5 flex-shrink-0 text-atlas-blue" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-700">Mobile money</p>
                <p className="mt-1 text-base font-semibold text-neutral-900">
                  {profile?.momoMsisdn ?? "Not set"}
                </p>
                <p className="mt-1 text-xs text-neutral-700">
                  This number is linked to your payment account.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-4">
            <p className="text-xs text-neutral-700">
              To update your contact information, please contact your SACCO staff.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="sms-consent-heading"
          className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6"
        >
          <h2 id="sms-consent-heading" className="text-lg font-bold text-neutral-900">
            Mobile Money SMS consent
          </h2>
          <SmsConsentCard senderHint={profile?.momoMsisdn ?? undefined} />
        </section>

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
            {LANGUAGES.map((language) => (
              <form key={language.code} action={updateLocaleAction}>
                <input type="hidden" name="locale" value={language.code} />
                <button
                  className={`
                    w-full min-h-[56px] rounded-xl border-2 px-4 py-3 font-semibold transition-all duration-interactive
                    focus:outline-none focus:ring-2 focus:ring-atlas-blue/30 focus:ring-offset-2
                    ${
                      profile?.locale === language.code
                        ? "border-atlas-blue bg-atlas-glow text-atlas-blue-dark"
                        : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                    }
                  `}
                  aria-pressed={profile?.locale === language.code}
                  type="submit"
                >
                  {language.label}
                </button>
              </form>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-neutral-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-atlas-blue" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-neutral-900">Help centre</h3>
            </div>
            <p className="mt-2 text-sm text-neutral-700">
              Chat with the SACCO+ assistant or call your local SACCO officer for support.
            </p>
          </article>
          <article className="rounded-2xl border border-neutral-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-atlas-blue" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-neutral-900">Statements</h3>
            </div>
            <p className="mt-2 text-sm text-neutral-700">
              Export your contribution history and share PDFs for personal records.
            </p>
          </article>
          <article className="rounded-2xl border border-neutral-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-atlas-blue" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-neutral-900">Privacy</h3>
            </div>
            <p className="mt-2 text-sm text-neutral-700">
              Your reference token keeps your payments secure. We never share your data without
              permission.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
