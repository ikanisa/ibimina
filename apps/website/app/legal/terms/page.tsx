export const metadata = {
  title: "Terms of Service",
  description: "SACCO+ Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 space-y-8 pb-16">
      <section className="text-center space-y-4 mb-12">
        <h1 className="text-5xl font-bold">Terms of Service</h1>
        <p className="text-sm opacity-80">Last updated: January 2025</p>
      </section>

      <div className="glass p-8 space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
          <p className="opacity-90">
            Welcome to SACCO+ (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). These Terms of
            Service (&quot;Terms&quot;) govern your use of the SACCO+ platform, including the client
            mobile application and staff administration portal (collectively, the
            &quot;Service&quot;).
          </p>
          <p className="opacity-90 mt-4">
            By accessing or using our Service, you agree to be bound by these Terms. If you do not
            agree to these Terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">2. Scope of Service</h2>
          <p className="opacity-90">
            SACCO+ is an <strong>intermediation-only platform</strong>. We do not handle, hold, or
            process financial transactions. Our Service provides:
          </p>
          <ul className="list-disc list-inside opacity-90 mt-4 space-y-2 pl-4">
            <li>Structured reference token issuance for member identification</li>
            <li>USSD payment instruction display</li>
            <li>Allocation-based statement generation from SMS confirmations</li>
            <li>Staff tools for member onboarding and group management</li>
          </ul>
          <p className="opacity-90 mt-4">
            <strong>Important:</strong> All monetary deposits go directly to your SACCO&apos;s
            Mobile Money merchant account. SACCO+ never touches your funds.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">3. User Responsibilities</h2>
          <h3 className="text-lg font-bold mt-4 mb-2">For Members:</h3>
          <ul className="list-disc list-inside opacity-90 space-y-2 pl-4">
            <li>Provide accurate information during onboarding</li>
            <li>Keep your reference token secure and confidential</li>
            <li>Use your own Mobile Money account for USSD payments</li>
            <li>Report any unauthorized access or suspicious activity immediately</li>
          </ul>

          <h3 className="text-lg font-bold mt-4 mb-2">For SACCO Staff:</h3>
          <ul className="list-disc list-inside opacity-90 space-y-2 pl-4">
            <li>Verify member identity before onboarding</li>
            <li>Review and approve member data accurately</li>
            <li>Maintain confidentiality of member information</li>
            <li>Use the Service only for authorized SACCO operations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">4. Data Privacy</h2>
          <p className="opacity-90">
            We take data privacy seriously. Please review our{" "}
            <a href="/legal/privacy" className="text-rwyellow hover:underline">
              Privacy Policy
            </a>{" "}
            for details on how we collect, use, and protect your personal information.
          </p>
          <p className="opacity-90 mt-4">
            <strong>Key Points:</strong>
          </p>
          <ul className="list-disc list-inside opacity-90 mt-2 space-y-2 pl-4">
            <li>Phone numbers are hashed for security</li>
            <li>Row-Level Security (RLS) ensures data isolation</li>
            <li>We never store National IDs or Mobile Money PINs</li>
            <li>All data is encrypted at rest and in transit</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">5. Limitation of Liability</h2>
          <p className="opacity-90">
            SACCO+ is an intermediation platform only. We are not responsible for:
          </p>
          <ul className="list-disc list-inside opacity-90 mt-4 space-y-2 pl-4">
            <li>Mobile Money transaction failures or delays</li>
            <li>USSD network outages or service interruptions</li>
            <li>Incorrect payments made using wrong reference tokens</li>
            <li>Disputes between members and SACCOs regarding contributions</li>
            <li>Loss of funds due to incorrect SACCO merchant account details</li>
          </ul>
          <p className="opacity-90 mt-4">
            Your SACCO is responsible for reconciling deposits and maintaining accurate records.
            SACCO+ provides allocation evidence as a best-effort service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">6. Intellectual Property</h2>
          <p className="opacity-90">
            All content, trademarks, logos, and intellectual property on the Service are owned by
            SACCO+ or our licensors. You may not copy, modify, distribute, or reverse-engineer any
            part of the Service without our explicit written permission.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">7. Service Availability</h2>
          <p className="opacity-90">
            We strive for 99.9% uptime, but we cannot guarantee uninterrupted service. Scheduled
            maintenance will be announced in advance. USSD payments will continue to work even if
            the SACCO+ platform is temporarily unavailable.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">8. Termination</h2>
          <p className="opacity-90">
            We reserve the right to suspend or terminate your access to the Service if you violate
            these Terms or engage in fraudulent activity. SACCOs may terminate their use of the
            Service with 30 days&apos; written notice.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">9. Changes to Terms</h2>
          <p className="opacity-90">
            We may update these Terms from time to time. We will notify users of significant changes
            via email or in-app notification. Continued use of the Service after changes constitutes
            acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">10. Governing Law</h2>
          <p className="opacity-90">
            These Terms are governed by the laws of the Republic of Rwanda. Any disputes arising
            from these Terms or use of the Service will be resolved in Rwandan courts.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">11. Contact Us</h2>
          <p className="opacity-90">If you have questions about these Terms, please contact us:</p>
          <ul className="opacity-90 mt-4 space-y-2">
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:legal@saccoplus.rw" className="text-rwyellow hover:underline">
                legal@saccoplus.rw
              </a>
            </li>
            <li>
              <strong>Phone:</strong> +250 788 000 000
            </li>
            <li>
              <strong>Address:</strong> KG 7 Ave, Kigali, Rwanda
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
