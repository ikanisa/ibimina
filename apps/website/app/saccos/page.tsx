import Link from "next/link";
import { Upload, FileCheck, BarChart3, Shield, Database, Users, ArrowRight } from "lucide-react";

export const metadata = {
  title: "For SACCOs",
  description: "How SACCO staff use SACCO+ to digitize ibimina groups",
};

export default function SACCOsPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 leading-tight">
            For SACCOs
          </h1>
          <p className="text-xl text-neutral-700 leading-relaxed max-w-2xl mx-auto">
            Digitize ibimina with zero liability. Staff-controlled onboarding and allocation
            reports.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 space-y-20">
        {/* Key Benefits */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Key Benefits</h2>
            <p className="text-lg text-neutral-700">Three reasons SACCOs choose SACCO+</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-white border border-neutral-200 rounded-xl p-8 hover:shadow-xl hover:border-neutral-300 hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 bg-brand-yellow rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield size={28} className="text-neutral-900" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">Zero Liability</h3>
              <p className="text-neutral-700 leading-relaxed">
                SACCO+ never handles funds. Deposits go directly to your MoMo merchant account. We
                only provide allocation evidence.
              </p>
            </div>
            <div className="group bg-white border border-neutral-200 rounded-xl p-8 hover:shadow-xl hover:border-neutral-300 hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 bg-brand-blue rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">Staff Controlled</h3>
              <p className="text-neutral-700 leading-relaxed">
                You approve all member onboarding and group creation. Members can only request to
                join.
              </p>
            </div>
            <div className="group bg-white border border-neutral-200 rounded-xl p-8 hover:shadow-xl hover:border-neutral-300 hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 bg-brand-green rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Database size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">No Core Integration</h3>
              <p className="text-neutral-700 leading-relaxed">
                Your legacy core banking system stays untouched. SACCO+ runs alongside as a
                lightweight layer.
              </p>
            </div>
          </div>
        </section>

        {/* Staff Flow */}
        <section id="staff-flow">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Staff Workflow</h2>
            <p className="text-lg text-neutral-700">
              Three simple steps to digitize your ibimina groups
            </p>
          </div>

          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white border border-neutral-200 rounded-xl p-8 flex gap-6">
              <div className="w-14 h-14 bg-brand-yellow rounded-full flex items-center justify-center flex-shrink-0">
                <Upload size={24} className="text-neutral-900" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-neutral-900">1. Upload Member List</h3>
                <p className="text-neutral-700 leading-relaxed">
                  Upload a CSV or photo of your handwritten ibimina member list. Our OCR extracts
                  names, phone numbers, and contribution amounts.
                </p>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-8 flex gap-6">
              <div className="w-14 h-14 bg-brand-blue rounded-full flex items-center justify-center flex-shrink-0">
                <FileCheck size={24} className="text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-neutral-900">2. Review & Approve</h3>
                <p className="text-neutral-700 leading-relaxed">
                  Staff review extracted data, correct any errors, and approve members. Each member
                  gets a structured reference token (e.g., NYA.GAS.TWIZ.001).
                </p>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-8 flex gap-6">
              <div className="w-14 h-14 bg-brand-green rounded-full flex items-center justify-center flex-shrink-0">
                <BarChart3 size={24} className="text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-neutral-900">
                  3. Export Allocation Reports
                </h3>
                <p className="text-neutral-700 leading-relaxed">
                  As payments come in via USSD, SACCO+ maps them to members by reference token.
                  Export allocation CSV reports for your records and bookkeeping.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sample CSV */}
        <section className="max-w-4xl mx-auto">
          <div className="bg-white border border-neutral-200 rounded-xl p-8 space-y-6">
            <h2 className="text-3xl font-bold text-neutral-900">Sample Member List CSV</h2>
            <p className="text-neutral-700 leading-relaxed">
              Upload a CSV file with this structure, or take a photo of your handwritten list:
            </p>
            <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200 overflow-x-auto">
              <pre className="text-sm text-neutral-900 font-mono">
                {`group_name,member_name,phone,initial_contribution
Twizigame,Mukamana Aline,+250788123456,20000
Twizigame,Uwera Grace,+250788234567,15000
Twizigame,Niyonshuti Jean,+250788345678,25000`}
              </pre>
            </div>
          </div>
        </section>

        {/* Data Privacy */}
        <section id="data-privacy" className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Data Privacy & Security</h2>
            <p className="text-lg text-neutral-700">
              Your members’ data is protected with enterprise-grade security
            </p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-8 space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-4">What we store</h3>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-success-600 text-xl flex-shrink-0">✓</span>
                  <span className="text-neutral-700">
                    Member names, phone numbers (hashed), reference tokens
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-success-600 text-xl flex-shrink-0">✓</span>
                  <span className="text-neutral-700">
                    Group metadata (name, creation date, member count)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-success-600 text-xl flex-shrink-0">✓</span>
                  <span className="text-neutral-700">
                    Allocation evidence (transaction IDs, amounts, timestamps)
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-8 border-t border-neutral-200">
              <h3 className="text-2xl font-bold text-neutral-900 mb-4">What we never store</h3>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-error-600 text-xl flex-shrink-0">✗</span>
                  <span className="text-neutral-700">
                    Actual funds (payments go directly to your MoMo merchant)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-error-600 text-xl flex-shrink-0">✗</span>
                  <span className="text-neutral-700">
                    National IDs or sensitive identity documents
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-error-600 text-xl flex-shrink-0">✗</span>
                  <span className="text-neutral-700">Mobile Money PINs or passwords</span>
                </li>
              </ul>
            </div>

            <div className="pt-8 border-t border-neutral-200">
              <p className="text-sm text-neutral-700 leading-relaxed">
                <strong className="text-neutral-900">Compliance:</strong> SACCO+ adheres to
                Rwanda&apos;s data protection guidelines. All data is encrypted at rest and in
                transit. Row-level security (RLS) ensures members can only see their own data.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-brand-blue to-brand-blue-dark rounded-2xl p-12 text-center text-white shadow-2xl">
            <h2 className="text-4xl font-bold mb-4">Ready to Join the Pilot?</h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              We&apos;re piloting with Nyamagabe Umurenge SACCOs. Contact us to digitize ibimina for
              your community.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-blue font-semibold rounded-lg hover:bg-neutral-100 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Contact Us
              <ArrowRight size={20} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
