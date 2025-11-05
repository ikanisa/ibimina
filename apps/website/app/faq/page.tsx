import { HelpCircle, Shield, Smartphone, Users, Database, FileText } from "lucide-react";

export const metadata = {
  title: "FAQ",
  description: "Frequently asked questions about SACCO+",
};

export default function FAQPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 leading-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-neutral-700 leading-relaxed max-w-2xl mx-auto">
            Everything you need to know about SACCO+
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 space-y-16">
        {/* General */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-brand-yellow rounded-xl flex items-center justify-center">
              <HelpCircle size={24} className="text-neutral-900" />
            </div>
            <h2 className="text-3xl font-bold text-neutral-900">General</h2>
          </div>

          <div className="space-y-4">
            <details className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg text-neutral-900 list-none">
                <span>What is SACCO+?</span>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-neutral-700 leading-relaxed">
                SACCO+ is a digital intermediation platform for Umurenge SACCOs in Rwanda. We
                digitize ibimina (savings groups) using USSD-first contributions. SACCO+ never
                handles funds—we only issue standardized references and produce allocation-based
                statements.
              </p>
            </details>

            <details className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg text-neutral-900 list-none">
                <span>How is SACCO+ different from traditional SACCO software?</span>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-neutral-700 leading-relaxed">
                Unlike traditional SACCO cores that manage accounts and process transactions, SACCO+
                is intermediation-only. We don&apos;t integrate with your core banking system.
                Deposits go directly to your MoMo merchant account via USSD. We simply map SMS
                confirmations to member reference tokens and produce statements.
              </p>
            </details>

            <details className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg text-neutral-900 list-none">
                <span>Who can use SACCO+?</span>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-neutral-700 leading-relaxed">
                SACCO+ is designed for Umurenge SACCOs across Rwanda. We&apos;re piloting with
                Nyamagabe District. SACCO staff onboard members and approve all groups. Members
                contribute via USSD and view statements in the mobile app.
              </p>
            </details>
          </div>
        </section>

        {/* Privacy & Security */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-brand-blue rounded-xl flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-neutral-900">Privacy & Security</h2>
          </div>

          <div className="space-y-4">
            <details className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg text-neutral-900 list-none">
                <span>Does SACCO+ handle my money?</span>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-neutral-700 leading-relaxed">
                No. SACCO+ never handles funds. When you make a USSD payment, your money goes
                directly to your SACCO&apos;s Mobile Money merchant account. SACCO+ only receives
                SMS confirmation notifications to map payments to your reference token.
              </p>
            </details>

            <details className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg text-neutral-900 list-none">
                <span>Is my personal data safe?</span>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-neutral-700 leading-relaxed">
                Yes. All data is encrypted at rest and in transit. We use Row-Level Security (RLS)
                to ensure you can only see your own data. Phone numbers are hashed. We never store
                National IDs or Mobile Money PINs. Audit logs track all data access.
              </p>
            </details>

            <details className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg text-neutral-900 list-none">
                <span>Can other members see my information?</span>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-neutral-700 leading-relaxed">
                No. Token-scoped RLS policies ensure members can only view their own groups and
                allocations. Even if devices are shared, your reference token is personal and your
                data remains private.
              </p>
            </details>
          </div>
        </section>

        {/* For Members */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-brand-green rounded-xl flex items-center justify-center">
              <Smartphone size={24} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-neutral-900">For Members</h2>
          </div>

          <div className="space-y-4">
            <details className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg text-neutral-900 list-none">
                <span>Do I need a smartphone?</span>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-neutral-700 leading-relaxed">
                No! USSD works on any mobile phone. To contribute, just dial *182# from your Mobile
                Money registered number. No data or internet required. The mobile app (for viewing
                statements) is optional and can be accessed as a PWA.
              </p>
            </details>

            <details className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg text-neutral-900 list-none">
                <span>What if I have multiple SIM cards?</span>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-neutral-700 leading-relaxed">
                Use the SIM card registered with your Mobile Money account when dialing USSD. Your
                phone may ask you to select which SIM to use. Choose the one linked to your MoMo
                account.
              </p>
            </details>

            <details className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg text-neutral-900 list-none">
                <span>How do I join an ibimina group?</span>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-neutral-700 leading-relaxed">
                Contact your SACCO staff to be onboarded. You&apos;ll receive a reference token
                (e.g., NYA.GAS.TWIZ.001). You can also request to join via the mobile app, but staff
                must approve your request before you can contribute.
              </p>
            </details>

            <details className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg text-neutral-900 list-none">
                <span>How long until my payment is confirmed?</span>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-neutral-700 leading-relaxed">
                You&apos;ll receive an SMS confirmation from Mobile Money within seconds. Your
                statement in the SACCO+ app will update within a few minutes once staff map the
                payment to your reference token.
              </p>
            </details>

            <details className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg text-neutral-900 list-none">
                <span>What if my device is shared with family members?</span>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-neutral-700 leading-relaxed">
                No problem! Your reference token is personal. As long as you use your own Mobile
                Money account and reference when making USSD payments, your contributions are
                tracked correctly. In the app, token-scoped security ensures you only see your own
                data.
              </p>
            </details>

            <details className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg text-neutral-900 list-none">
                <span>Can I contribute offline?</span>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-neutral-700 leading-relaxed">
                USSD works without internet, so yes! As long as you have mobile network coverage,
                you can dial *182# and contribute. The app works offline too (PWA), showing your
                cached statements and reference card.
              </p>
            </details>
          </div>
        </section>

        {/* For SACCOs */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-brand-yellow rounded-xl flex items-center justify-center">
              <Users size={24} className="text-neutral-900" />
            </div>
            <h2 className="text-3xl font-bold text-neutral-900">For SACCOs</h2>
          </div>

          <div className="space-y-4">
            <details className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg text-neutral-900 list-none">
                <span>Do we need to integrate with our core banking system?</span>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-neutral-700 leading-relaxed">
                No. SACCO+ runs alongside your existing core without integration. Deposits go to
                your MoMo merchant account. We export allocation CSV reports that you can import
                into your core or use for bookkeeping.
              </p>
            </details>

            <details className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg text-neutral-900 list-none">
                <span>How do we onboard members?</span>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-neutral-700 leading-relaxed">
                Upload a CSV or photo of your handwritten member list. Our OCR extracts names and
                phone numbers. Staff review and approve. Each member gets a structured reference
                token. The process takes minutes, not hours.
              </p>
            </details>

            <details className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg text-neutral-900 list-none">
                <span>What reports can we export?</span>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-neutral-700 leading-relaxed">
                You can export allocation CSV reports showing: date, member reference, amount,
                transaction ID, status (CONFIRMED/PENDING). Filter by group, date range, or member.
                Use these reports for reconciliation and audits.
              </p>
            </details>

            <details className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg text-neutral-900 list-none">
                <span>What if a member loses their reference token?</span>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-neutral-700 leading-relaxed">
                Staff can reissue the reference card from the admin app. The token itself
                doesn&apos;t change—it&apos;s tied to the member&apos;s account. Just print a new
                card with the same reference.
              </p>
            </details>
          </div>
        </section>

        {/* Technical */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-brand-blue rounded-xl flex items-center justify-center">
              <Database size={24} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-neutral-900">Technical</h2>
          </div>

          <div className="space-y-4">
            <details className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg text-neutral-900 list-none">
                <span>What happens if SACCO+ goes down?</span>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-neutral-700 leading-relaxed">
                USSD payments still work—they go directly to your MoMo merchant account. The app has
                offline fallback pages showing cached statements and reference cards. SMS ingestion
                resumes when the service recovers, so no payments are lost.
              </p>
            </details>

            <details className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg text-neutral-900 list-none">
                <span>Is there a backup of our data?</span>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-neutral-700 leading-relaxed">
                Yes. Daily automated backups with encryption. You can export allocation reports at
                any time as CSV. We also provide weekly backup summaries to SACCO admins.
              </p>
            </details>

            <details className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg text-neutral-900 list-none">
                <span>What languages are supported?</span>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-neutral-700 leading-relaxed">
                Kinyarwanda (default), English, and French. Members can toggle language in the app.
                USSD instructions are available in all three languages.
              </p>
            </details>

            <details className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg text-neutral-900 list-none">
                <span>Can we use SACCO+ on desktop computers?</span>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-neutral-700 leading-relaxed">
                Yes. The staff admin app works on desktop browsers. Members can also access their
                statements via web browser on any device (responsive design).
              </p>
            </details>
          </div>
        </section>

        {/* Contact CTA */}
        <section>
          <div className="bg-gradient-to-br from-brand-blue to-brand-blue-dark rounded-2xl p-12 text-center text-white shadow-2xl">
            <FileText size={48} className="mx-auto text-white mb-6" />
            <h2 className="text-4xl font-bold mb-4">Still Have Questions?</h2>
            <p className="text-xl text-white/90 mb-8">
              We&apos;re here to help. Reach out anytime.
            </p>
            <a
              href="/contact"
              className="inline-block px-8 py-4 bg-white text-brand-blue font-semibold rounded-lg hover:bg-neutral-100 transition-all duration-200"
            >
              Contact Us
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
