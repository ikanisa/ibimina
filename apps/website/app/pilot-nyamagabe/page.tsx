import Link from "next/link";
import { Target, Calendar, CheckCircle2, TrendingUp, Users, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Pilot: Nyamagabe",
  description: "12-week pilot to digitize ibimina in Nyamagabe District",
};

export default function PilotPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 leading-tight">
            Pilot: Nyamagabe District
          </h1>
          <p className="text-xl text-neutral-700 leading-relaxed max-w-2xl mx-auto">
            12-week sprint to digitize ibimina across Nyamagabe Umurenge SACCOs
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 space-y-20">
        {/* Objectives */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Pilot Objectives</h2>
            <p className="text-lg text-neutral-700">
              Four key goals to validate SACCO+ in real-world conditions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="group bg-white border border-neutral-200 rounded-xl p-8 hover:shadow-xl hover:border-neutral-300 hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 bg-brand-yellow rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Target size={28} className="text-neutral-900" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">Validate Scope</h3>
              <p className="text-neutral-700 leading-relaxed">
                Prove that intermediation-only (no funds, no core integration) works for rural
                Umurenge SACCOs with USSD-first members.
              </p>
            </div>

            <div className="group bg-white border border-neutral-200 rounded-xl p-8 hover:shadow-xl hover:border-neutral-300 hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 bg-brand-blue rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">Onboard 500+ Members</h3>
              <p className="text-neutral-700 leading-relaxed">
                Target 10-15 ibimina groups, ~50 members each. Test staff workflows: upload → OCR →
                approve → allocate.
              </p>
            </div>

            <div className="group bg-white border border-neutral-200 rounded-xl p-8 hover:shadow-xl hover:border-neutral-300 hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 bg-brand-green rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">100% USSD Coverage</h3>
              <p className="text-neutral-700 leading-relaxed">
                Ensure every member can dial *182# and contribute. Test dual-SIM, shared devices,
                and low-literacy scenarios.
              </p>
            </div>

            <div className="group bg-white border border-neutral-200 rounded-xl p-8 hover:shadow-xl hover:border-neutral-300 hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 bg-neutral-900 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CheckCircle2 size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">Zero Data Breaches</h3>
              <p className="text-neutral-700 leading-relaxed">
                Validate RLS policies, token-scoped queries, and audit logs. No member should see
                another&apos;s data.
              </p>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">12-Week Timeline</h2>
            <p className="text-lg text-neutral-700">
              Phased approach from onboarding to evaluation
            </p>
          </div>

          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white border border-neutral-200 rounded-xl p-8 flex gap-6 items-start">
              <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center text-neutral-900 text-lg font-bold flex-shrink-0">
                W1-3
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-neutral-900">Onboarding & Training</h3>
                <p className="text-neutral-700 leading-relaxed">
                  Train SACCO staff on upload workflows, OCR review, and member approval. Set up
                  merchant codes and reference token structure.
                </p>
                <div className="text-sm text-success-700 font-semibold bg-success-50 inline-block px-3 py-1 rounded-full">
                  Deliverable: 3 SACCOs onboarded
                </div>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-8 flex gap-6 items-start">
              <div className="w-16 h-16 bg-brand-blue rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                W4-6
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-neutral-900">Member Rollout</h3>
                <p className="text-neutral-700 leading-relaxed">
                  Upload first batch of member lists, approve 200+ members, distribute reference
                  cards. Test USSD payment flows with pilot groups.
                </p>
                <div className="text-sm text-success-700 font-semibold bg-success-50 inline-block px-3 py-1 rounded-full">
                  Deliverable: 200 members contributing via USSD
                </div>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-8 flex gap-6 items-start">
              <div className="w-16 h-16 bg-brand-green rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                W7-9
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-neutral-900">Scale & Refine</h3>
                <p className="text-neutral-700 leading-relaxed">
                  Expand to remaining groups. Refine SMS ingestion, allocation mapping, and
                  statement exports. Address edge cases (dual-SIM, shared devices).
                </p>
                <div className="text-sm text-success-700 font-semibold bg-success-50 inline-block px-3 py-1 rounded-full">
                  Deliverable: 500+ members, 15 groups active
                </div>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-8 flex gap-6 items-start">
              <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                W10-12
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-neutral-900">Evaluation & Handoff</h3>
                <p className="text-neutral-700 leading-relaxed">
                  Collect feedback from staff and members. Run final security audits. Export
                  allocation reports. Document lessons learned for national rollout.
                </p>
                <div className="text-sm text-success-700 font-semibold bg-success-50 inline-block px-3 py-1 rounded-full">
                  Deliverable: Pilot report, production readiness checklist
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Key Performance Indicators</h2>
            <p className="text-lg text-neutral-700">Success metrics and risk mitigations</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-neutral-200 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-neutral-900 mb-6">Success Metrics</h3>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-success-600 text-xl flex-shrink-0">✓</span>
                  <span className="text-neutral-700">&ge;500 members onboarded and active</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-success-600 text-xl flex-shrink-0">✓</span>
                  <span className="text-neutral-700">&ge;80% USSD payment success rate</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-success-600 text-xl flex-shrink-0">✓</span>
                  <span className="text-neutral-700">Zero data breaches or PII leaks</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-success-600 text-xl flex-shrink-0">✓</span>
                  <span className="text-neutral-700">
                    &ge;90% staff satisfaction (training + tools)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-success-600 text-xl flex-shrink-0">✓</span>
                  <span className="text-neutral-700">
                    &ge;85% member satisfaction (ease of use)
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-neutral-900 mb-6">Risk Mitigations</h3>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-warning-600 text-xl flex-shrink-0">⚠</span>
                  <span className="text-neutral-700">
                    Low USSD literacy → printed instruction cards
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-warning-600 text-xl flex-shrink-0">⚠</span>
                  <span className="text-neutral-700">Shared devices → token-scoped RLS</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-warning-600 text-xl flex-shrink-0">⚠</span>
                  <span className="text-neutral-700">
                    Staff resistance → hands-on training + support
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-warning-600 text-xl flex-shrink-0">⚠</span>
                  <span className="text-neutral-700">
                    Network outages → offline-first PWA fallback
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Join CTA */}
        <section>
          <div className="bg-gradient-to-br from-brand-blue to-brand-blue-dark rounded-2xl p-12 text-center text-white shadow-2xl">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Calendar size={32} className="text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4">Join the Pilot</h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Are you a SACCO staff member or district stakeholder in Nyamagabe? Contact us to be
              part of this 12-week sprint.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-blue font-semibold rounded-lg hover:bg-neutral-100 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Contact Us
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/saccos"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-200"
              >
                Learn About Staff Tools
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
