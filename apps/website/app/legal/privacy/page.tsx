export const metadata = {
  title: "Privacy Policy",
  description: "SACCO+ Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 space-y-8 pb-16">
      <section className="text-center space-y-4 mb-12">
        <h1 className="text-5xl font-bold">Privacy Policy</h1>
        <p className="text-sm opacity-80">Last updated: January 2025</p>
      </section>

      <div className="glass p-8 space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
          <p className="opacity-90">
            SACCO+ (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting
            your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard
            your personal information when you use the SACCO+ platform.
          </p>
          <p className="opacity-90 mt-4">
            By using our Service, you consent to the practices described in this Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>

          <h3 className="text-lg font-bold mt-4 mb-2">2.1 Information You Provide</h3>
          <ul className="list-disc list-inside opacity-90 space-y-2 pl-4">
            <li>
              <strong>Member Onboarding:</strong> Name, phone number (hashed), Mobile Money account
              number, group membership details
            </li>
            <li>
              <strong>Staff Accounts:</strong> Name, email, phone number, SACCO affiliation, role
            </li>
            <li>
              <strong>USSD Payments:</strong> Reference tokens, payment amounts, timestamps,
              transaction IDs (from SMS confirmations)
            </li>
          </ul>

          <h3 className="text-lg font-bold mt-4 mb-2">2.2 Information We Do NOT Collect</h3>
          <ul className="list-disc list-inside opacity-90 space-y-2 pl-4">
            <li>National IDs or other government-issued identity documents</li>
            <li>Mobile Money PINs or passwords</li>
            <li>Biometric data (fingerprints, facial recognition)</li>
            <li>Precise geolocation data</li>
            <li>Actual funds (all deposits go directly to SACCO MoMo merchant accounts)</li>
          </ul>

          <h3 className="text-lg font-bold mt-4 mb-2">2.3 Automatically Collected Information</h3>
          <ul className="list-disc list-inside opacity-90 space-y-2 pl-4">
            <li>Device information (model, OS version, browser type)</li>
            <li>App usage analytics (page views, button clicks, error logs)</li>
            <li>Network information (IP address—not stored, only logged for security)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
          <p className="opacity-90">We use your information to:</p>
          <ul className="list-disc list-inside opacity-90 mt-4 space-y-2 pl-4">
            <li>Issue and manage reference tokens for USSD payments</li>
            <li>Map SMS confirmations to member contributions</li>
            <li>Generate allocation-based statements</li>
            <li>Provide staff tools for member onboarding and group management</li>
            <li>Detect and prevent fraud or unauthorized access</li>
            <li>Improve our Service and user experience</li>
            <li>Comply with legal obligations and respond to lawful requests</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">4. How We Protect Your Information</h2>
          <p className="opacity-90">We implement industry-standard security measures:</p>
          <ul className="list-disc list-inside opacity-90 mt-4 space-y-2 pl-4">
            <li>
              <strong>Encryption:</strong> All data is encrypted at rest (AES-256) and in transit
              (TLS 1.3)
            </li>
            <li>
              <strong>Row-Level Security (RLS):</strong> Database policies ensure members can only
              access their own data
            </li>
            <li>
              <strong>Phone Number Hashing:</strong> Mobile numbers are hashed using HMAC-SHA256
              with a secret key
            </li>
            <li>
              <strong>Access Controls:</strong> Staff access is role-based with audit logs
            </li>
            <li>
              <strong>Regular Audits:</strong> Third-party security audits every 6 months
            </li>
            <li>
              <strong>Backups:</strong> Daily automated backups with encryption and retention period
              of 90 days
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">5. Data Sharing and Disclosure</h2>
          <p className="opacity-90">
            We <strong>do not sell</strong> your personal information. We may share data in the
            following limited circumstances:
          </p>
          <ul className="list-disc list-inside opacity-90 mt-4 space-y-2 pl-4">
            <li>
              <strong>With Your SACCO:</strong> Staff can view member data for their affiliated
              SACCO only
            </li>
            <li>
              <strong>Service Providers:</strong> Third-party vendors (e.g., Supabase for database
              hosting) under strict data processing agreements
            </li>
            <li>
              <strong>Legal Compliance:</strong> If required by law, court order, or government
              request
            </li>
            <li>
              <strong>Security Incidents:</strong> To protect against fraud, abuse, or security
              threats
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">6. Data Retention</h2>
          <p className="opacity-90">We retain your personal information for:</p>
          <ul className="list-disc list-inside opacity-90 mt-4 space-y-2 pl-4">
            <li>
              <strong>Active Members:</strong> As long as you are an active member of a group
            </li>
            <li>
              <strong>Inactive Members:</strong> Up to 2 years after your last contribution
            </li>
            <li>
              <strong>Audit Logs:</strong> 5 years for compliance and dispute resolution
            </li>
            <li>
              <strong>Deleted Accounts:</strong> Personal data is anonymized within 30 days of
              deletion request
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">7. Your Rights</h2>
          <p className="opacity-90">You have the right to:</p>
          <ul className="list-disc list-inside opacity-90 mt-4 space-y-2 pl-4">
            <li>
              <strong>Access:</strong> Request a copy of your personal data
            </li>
            <li>
              <strong>Correction:</strong> Update or correct inaccurate information
            </li>
            <li>
              <strong>Deletion:</strong> Request deletion of your data (subject to legal retention
              requirements)
            </li>
            <li>
              <strong>Data Portability:</strong> Export your allocation statements as CSV
            </li>
            <li>
              <strong>Withdraw Consent:</strong> Stop using the Service at any time
            </li>
          </ul>
          <p className="opacity-90 mt-4">
            To exercise these rights, contact us at{" "}
            <a href="mailto:privacy@saccoplus.rw" className="text-rwyellow hover:underline">
              privacy@saccoplus.rw
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">8. Children&apos;s Privacy</h2>
          <p className="opacity-90">
            SACCO+ is intended for adults aged 18 and over. We do not knowingly collect personal
            information from children under 18. If we become aware of such data, we will delete it
            promptly.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">9. Third-Party Services</h2>
          <p className="opacity-90">
            Our Service may contain links to third-party websites or services (e.g., Mobile Money
            providers). We are not responsible for the privacy practices of these third parties.
            Please review their privacy policies separately.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">10. Changes to This Privacy Policy</h2>
          <p className="opacity-90">
            We may update this Privacy Policy from time to time. We will notify you of significant
            changes via email or in-app notification. The &quot;Last updated&quot; date at the top
            reflects the most recent version.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">11. Contact Us</h2>
          <p className="opacity-90">
            If you have questions or concerns about this Privacy Policy, please contact us:
          </p>
          <ul className="opacity-90 mt-4 space-y-2">
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:privacy@saccoplus.rw" className="text-rwyellow hover:underline">
                privacy@saccoplus.rw
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

        <section>
          <h2 className="text-2xl font-bold mb-4">12. Compliance</h2>
          <p className="opacity-90">
            SACCO+ complies with the Republic of Rwanda&apos;s data protection guidelines. We adhere
            to international best practices for data security and privacy, including GDPR principles
            where applicable.
          </p>
        </section>
      </div>
    </div>
  );
}
