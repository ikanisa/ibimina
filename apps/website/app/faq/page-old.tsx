import { HelpCircle, Shield, Smartphone, Users, Database, FileText } from "lucide-react";

export const metadata = {
  title: "FAQ",
  description: "Frequently asked questions about SACCO+",
};

export default function FAQPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 space-y-16 pb-16">
      {/* Header */}
      <section className="text-center space-y-4">
        <h1 className="text-5xl font-bold">Frequently Asked Questions</h1>
        <p className="text-xl text-neutral-600">Everything you need to know about SACCO+</p>
      </section>

      {/* General */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <HelpCircle size={32} className="text-brand-yellow" />
          <h2 className="text-3xl font-bold">General</h2>
        </div>

        <details className="bg-white border border-neutral-200 rounded-xl p-6">
          <summary className="text-xl font-bold cursor-pointer">What is SACCO+?</summary>
          <p className="mt-4 text-neutral-600">
            SACCO+ is a digital intermediation platform for Umurenge SACCOs in Rwanda. We digitize
            ibimina (savings groups) using USSD-first contributions. SACCO+ never handles funds—we
            only issue standardized references and produce allocation-based statements.
          </p>
        </details>

        <details className="bg-white border border-neutral-200 rounded-xl p-6">
          <summary className="text-xl font-bold cursor-pointer">
            How is SACCO+ different from traditional SACCO software?
          </summary>
          <p className="mt-4 text-neutral-600">
            Unlike traditional SACCO cores that manage accounts and process transactions, SACCO+ is
            intermediation-only. We don&apos;t integrate with your core banking system. Deposits go
            directly to your MoMo merchant account via USSD. We simply map SMS confirmations to
            member reference tokens and produce statements.
          </p>
        </details>

        <details className="bg-white border border-neutral-200 rounded-xl p-6">
          <summary className="text-xl font-bold cursor-pointer">Who can use SACCO+?</summary>
          <p className="mt-4 text-neutral-600">
            SACCO+ is designed for Umurenge SACCOs across Rwanda. We&apos;re piloting with Nyamagabe
            District. SACCO staff onboard members and approve all groups. Members contribute via
            USSD and view statements in the mobile app.
          </p>
        </details>
      </section>

      {/* Privacy & Security */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield size={32} className="text-brand-blue" />
          <h2 className="text-3xl font-bold">Privacy & Security</h2>
        </div>

        <details className="bg-white border border-neutral-200 rounded-xl p-6">
          <summary className="text-xl font-bold cursor-pointer">
            Does SACCO+ handle my money?
          </summary>
          <p className="mt-4 text-neutral-600">
            No. SACCO+ never handles funds. When you make a USSD payment, your money goes directly
            to your SACCO&apos;s Mobile Money merchant account. SACCO+ only receives SMS
            confirmation notifications to map payments to your reference token.
          </p>
        </details>

        <details className="bg-white border border-neutral-200 rounded-xl p-6">
          <summary className="text-xl font-bold cursor-pointer">Is my personal data safe?</summary>
          <p className="mt-4 text-neutral-600">
            Yes. All data is encrypted at rest and in transit. We use Row-Level Security (RLS) to
            ensure you can only see your own data. Phone numbers are hashed. We never store National
            IDs or Mobile Money PINs. Audit logs track all data access.
          </p>
        </details>

        <details className="bg-white border border-neutral-200 rounded-xl p-6">
          <summary className="text-xl font-bold cursor-pointer">
            Can other members see my information?
          </summary>
          <p className="mt-4 text-neutral-600">
            No. Token-scoped RLS policies ensure members can only view their own groups and
            allocations. Even if devices are shared, your reference token is personal and your data
            remains private.
          </p>
        </details>
      </section>

      {/* For Members */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Smartphone size={32} className="text-brand-green" />
          <h2 className="text-3xl font-bold">For Members</h2>
        </div>

        <details className="bg-white border border-neutral-200 rounded-xl p-6">
          <summary className="text-xl font-bold cursor-pointer">Do I need a smartphone?</summary>
          <p className="mt-4 text-neutral-600">
            No! USSD works on any mobile phone. To contribute, just dial *182# from your Mobile
            Money registered number. No data or internet required. The mobile app (for viewing
            statements) is optional and can be accessed as a PWA.
          </p>
        </details>

        <details className="bg-white border border-neutral-200 rounded-xl p-6">
          <summary className="text-xl font-bold cursor-pointer">
            What if I have multiple SIM cards?
          </summary>
          <p className="mt-4 text-neutral-600">
            Use the SIM card registered with your Mobile Money account when dialing USSD. Your phone
            may ask you to select which SIM to use. Choose the one linked to your MoMo account.
          </p>
        </details>

        <details className="bg-white border border-neutral-200 rounded-xl p-6">
          <summary className="text-xl font-bold cursor-pointer">
            How do I join an ibimina group?
          </summary>
          <p className="mt-4 text-neutral-600">
            Contact your SACCO staff to be onboarded. You&apos;ll receive a reference token (e.g.,
            NYA.GAS.TWIZ.001). You can also request to join via the mobile app, but staff must
            approve your request before you can contribute.
          </p>
        </details>

        <details className="bg-white border border-neutral-200 rounded-xl p-6">
          <summary className="text-xl font-bold cursor-pointer">
            How long until my payment is confirmed?
          </summary>
          <p className="mt-4 text-neutral-600">
            You&apos;ll receive an SMS confirmation from Mobile Money within seconds. Your statement
            in the SACCO+ app will update within a few minutes once staff map the payment to your
            reference token.
          </p>
        </details>

        <details className="bg-white border border-neutral-200 rounded-xl p-6">
          <summary className="text-xl font-bold cursor-pointer">
            What if my device is shared with family members?
          </summary>
          <p className="mt-4 text-neutral-600">
            No problem! Your reference token is personal. As long as you use your own Mobile Money
            account and reference when making USSD payments, your contributions are tracked
            correctly. In the app, token-scoped security ensures you only see your own data.
          </p>
        </details>

        <details className="bg-white border border-neutral-200 rounded-xl p-6">
          <summary className="text-xl font-bold cursor-pointer">Can I contribute offline?</summary>
          <p className="mt-4 text-neutral-600">
            USSD works without internet, so yes! As long as you have mobile network coverage, you
            can dial *182# and contribute. The app works offline too (PWA), showing your cached
            statements and reference card.
          </p>
        </details>
      </section>

      {/* For SACCOs */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Users size={32} className="text-brand-yellow" />
          <h2 className="text-3xl font-bold">For SACCOs</h2>
        </div>

        <details className="bg-white border border-neutral-200 rounded-xl p-6">
          <summary className="text-xl font-bold cursor-pointer">
            Do we need to integrate with our core banking system?
          </summary>
          <p className="mt-4 text-neutral-600">
            No. SACCO+ runs alongside your existing core without integration. Deposits go to your
            MoMo merchant account. We export allocation CSV reports that you can import into your
            core or use for bookkeeping.
          </p>
        </details>

        <details className="bg-white border border-neutral-200 rounded-xl p-6">
          <summary className="text-xl font-bold cursor-pointer">How do we onboard members?</summary>
          <p className="mt-4 text-neutral-600">
            Upload a CSV or photo of your handwritten member list. Our OCR extracts names and phone
            numbers. Staff review and approve. Each member gets a structured reference token. The
            process takes minutes, not hours.
          </p>
        </details>

        <details className="bg-white border border-neutral-200 rounded-xl p-6">
          <summary className="text-xl font-bold cursor-pointer">
            What reports can we export?
          </summary>
          <p className="mt-4 text-neutral-600">
            You can export allocation CSV reports showing: date, member reference, amount,
            transaction ID, status (CONFIRMED/PENDING). Filter by group, date range, or member. Use
            these reports for reconciliation and audits.
          </p>
        </details>

        <details className="bg-white border border-neutral-200 rounded-xl p-6">
          <summary className="text-xl font-bold cursor-pointer">
            What if a member loses their reference token?
          </summary>
          <p className="mt-4 text-neutral-600">
            Staff can reissue the reference card from the admin app. The token itself doesn&apos;t
            change—it&apos;s tied to the member&apos;s account. Just print a new card with the same
            reference.
          </p>
        </details>
      </section>

      {/* Technical */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Database size={32} className="text-brand-blue" />
          <h2 className="text-3xl font-bold">Technical</h2>
        </div>

        <details className="bg-white border border-neutral-200 rounded-xl p-6">
          <summary className="text-xl font-bold cursor-pointer">
            What happens if SACCO+ goes down?
          </summary>
          <p className="mt-4 text-neutral-600">
            USSD payments still work—they go directly to your MoMo merchant account. The app has
            offline fallback pages showing cached statements and reference cards. SMS ingestion
            resumes when the service recovers, so no payments are lost.
          </p>
        </details>

        <details className="bg-white border border-neutral-200 rounded-xl p-6">
          <summary className="text-xl font-bold cursor-pointer">
            Is there a backup of our data?
          </summary>
          <p className="mt-4 text-neutral-600">
            Yes. Daily automated backups with encryption. You can export allocation reports at any
            time as CSV. We also provide weekly backup summaries to SACCO admins.
          </p>
        </details>

        <details className="bg-white border border-neutral-200 rounded-xl p-6">
          <summary className="text-xl font-bold cursor-pointer">
            What languages are supported?
          </summary>
          <p className="mt-4 text-neutral-600">
            Kinyarwanda (default), English, and French. Members can toggle language in the app. USSD
            instructions are available in all three languages.
          </p>
        </details>

        <details className="bg-white border border-neutral-200 rounded-xl p-6">
          <summary className="text-xl font-bold cursor-pointer">
            Can we use SACCO+ on desktop computers?
          </summary>
          <p className="mt-4 text-neutral-600">
            Yes. The staff admin app works on desktop browsers. Members can also access their
            statements via web browser on any device (responsive design).
          </p>
        </details>
      </section>

      {/* Contact CTA */}
      <section className="bg-white border border-neutral-200 rounded-xl p-8 text-center space-y-4">
        <FileText size={48} className="mx-auto text-brand-yellow" />
        <h2 className="text-2xl font-bold">Still Have Questions?</h2>
        <p className="text-neutral-600">We&apos;re here to help. Reach out anytime.</p>
        <a
          href="/contact"
          className="inline-block glass px-8 py-4 font-semibold hover:bg-white/20 transition-all"
        >
          Contact Us
        </a>
      </section>
    </div>
  );
}
