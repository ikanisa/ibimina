import { Upload, FileCheck, BarChart3, Shield, Database, Users } from "lucide-react";

export const metadata = {
  title: "For SACCOs",
  description: "How SACCO staff use SACCO+ to digitize ibimina groups",
};

export default function SACCOsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 space-y-16 pb-16">
      {/* Header */}
      <section className="text-center space-y-4">
        <h1 className="text-5xl font-bold">For SACCOs</h1>
        <p className="text-xl opacity-90">
          Digitize ibimina with zero liability. Staff-controlled onboarding and allocation reports.
        </p>
      </section>

      {/* Key Benefits */}
      <section className="grid md:grid-cols-3 gap-6">
        <div className="glass p-6 space-y-4">
          <Shield size={32} className="text-rwyellow" />
          <h3 className="text-xl font-bold">Zero Liability</h3>
          <p className="opacity-90">
            SACCO+ never handles funds. Deposits go directly to your MoMo merchant account. We only
            provide allocation evidence.
          </p>
        </div>
        <div className="glass p-6 space-y-4">
          <Users size={32} className="text-rwblue" />
          <h3 className="text-xl font-bold">Staff Controlled</h3>
          <p className="opacity-90">
            You approve all member onboarding and group creation. Members can only request to join.
          </p>
        </div>
        <div className="glass p-6 space-y-4">
          <Database size={32} className="text-rwgreen" />
          <h3 className="text-xl font-bold">No Core Integration</h3>
          <p className="opacity-90">
            Your legacy core banking system stays untouched. SACCO+ runs alongside as a lightweight
            layer.
          </p>
        </div>
      </section>

      {/* Staff Flow */}
      <section id="staff-flow" className="space-y-8">
        <h2 className="text-3xl font-bold text-center">Staff Workflow</h2>
        <div className="space-y-6">
          <div className="glass p-6 flex gap-6">
            <div className="w-12 h-12 bg-rwyellow rounded-full flex items-center justify-center text-ink flex-shrink-0">
              <Upload size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">1. Upload Member List</h3>
              <p className="opacity-90">
                Upload a CSV or photo of your handwritten ibimina member list. Our OCR extracts
                names, phone numbers, and contribution amounts.
              </p>
            </div>
          </div>

          <div className="glass p-6 flex gap-6">
            <div className="w-12 h-12 bg-rwblue rounded-full flex items-center justify-center text-ink flex-shrink-0">
              <FileCheck size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">2. Review & Approve</h3>
              <p className="opacity-90">
                Staff review extracted data, correct any errors, and approve members. Each member
                gets a structured reference token (e.g., NYA.GAS.TWIZ.001).
              </p>
            </div>
          </div>

          <div className="glass p-6 flex gap-6">
            <div className="w-12 h-12 bg-rwgreen rounded-full flex items-center justify-center text-white flex-shrink-0">
              <BarChart3 size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">3. Export Allocation Reports</h3>
              <p className="opacity-90">
                As payments come in via USSD, SACCO+ maps them to members by reference token. Export
                allocation CSV reports for your records and bookkeeping.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample CSV */}
      <section className="glass p-8 space-y-4">
        <h2 className="text-2xl font-bold">Sample Member List CSV</h2>
        <p className="opacity-90">
          Upload a CSV file with this structure, or take a photo of your handwritten list:
        </p>
        <div className="bg-white/10 p-4 rounded overflow-x-auto">
          <pre className="text-sm">
            {`group_name,member_name,phone,initial_contribution
Twizigame,Mukamana Aline,+250788123456,20000
Twizigame,Uwera Grace,+250788234567,15000
Twizigame,Niyonshuti Jean,+250788345678,25000`}
          </pre>
        </div>
      </section>

      {/* Data Privacy */}
      <section id="data-privacy" className="space-y-6">
        <h2 className="text-3xl font-bold text-center">Data Privacy & Security</h2>
        <div className="glass p-8 space-y-4">
          <h3 className="text-xl font-bold">What we store</h3>
          <ul className="space-y-2 opacity-90">
            <li className="flex gap-3">
              <span className="text-rwgreen">✓</span>
              <span>Member names, phone numbers (hashed), reference tokens</span>
            </li>
            <li className="flex gap-3">
              <span className="text-rwgreen">✓</span>
              <span>Group metadata (name, creation date, member count)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-rwgreen">✓</span>
              <span>Allocation evidence (transaction IDs, amounts, timestamps)</span>
            </li>
          </ul>

          <h3 className="text-xl font-bold mt-6">What we never store</h3>
          <ul className="space-y-2 opacity-90">
            <li className="flex gap-3">
              <span className="text-rwyellow">✗</span>
              <span>Actual funds (payments go directly to your MoMo merchant)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-rwyellow">✗</span>
              <span>National IDs or sensitive identity documents</span>
            </li>
            <li className="flex gap-3">
              <span className="text-rwyellow">✗</span>
              <span>Mobile Money PINs or passwords</span>
            </li>
          </ul>

          <div className="pt-4 border-t border-white/20 text-sm opacity-90">
            <p>
              <strong>Compliance:</strong> SACCO+ adheres to Rwanda&apos;s data protection
              guidelines. All data is encrypted at rest and in transit. Row-level security (RLS)
              ensures members can only see their own data.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="glass p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold">Ready to Join the Pilot?</h2>
        <p className="opacity-90 max-w-xl mx-auto">
          We&apos;re piloting with Nyamagabe Umurenge SACCOs. Contact us to digitize ibimina for
          your community.
        </p>
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
