import { Target, Calendar, CheckCircle2, TrendingUp, Users } from "lucide-react";

export const metadata = {
  title: "Pilot: Nyamagabe",
  description: "12-week pilot to digitize ibimina in Nyamagabe District",
};

export default function PilotPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 space-y-16 pb-16">
      {/* Header */}
      <section className="text-center space-y-4">
        <h1 className="text-5xl font-bold">Pilot: Nyamagabe District</h1>
        <p className="text-xl text-neutral-700">
          12-week sprint to digitize ibimina across Nyamagabe Umurenge SACCOs
        </p>
      </section>

      {/* Objectives */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-center">Pilot Objectives</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-3">
            <Target size={32} className="text-brand-yellow" />
            <h3 className="text-xl font-bold">Validate Scope</h3>
            <p className="text-neutral-700">
              Prove that intermediation-only (no funds, no core integration) works for rural
              Umurenge SACCOs with USSD-first members.
            </p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-3">
            <Users size={32} className="text-brand-blue" />
            <h3 className="text-xl font-bold">Onboard 500+ Members</h3>
            <p className="text-neutral-700">
              Target 10-15 ibimina groups, ~50 members each. Test staff workflows: upload → OCR →
              approve → allocate.
            </p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-3">
            <TrendingUp size={32} className="text-brand-green" />
            <h3 className="text-xl font-bold">100% USSD Coverage</h3>
            <p className="text-neutral-700">
              Ensure every member can dial *182# and contribute. Test dual-SIM, shared devices, and
              low-literacy scenarios.
            </p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-3">
            <CheckCircle2 size={32} className="text-white" />
            <h3 className="text-xl font-bold">Zero Data Breaches</h3>
            <p className="text-neutral-700">
              Validate RLS policies, token-scoped queries, and audit logs. No member should see
              another&apos;s data.
            </p>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold text-center">12-Week Timeline</h2>
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 flex gap-6 items-start">
            <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center text-neutral-900 font-bold flex-shrink-0">
              W1-3
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Onboarding & Training</h3>
              <p className="text-neutral-700">
                Train SACCO staff on upload workflows, OCR review, and member approval. Set up
                merchant codes and reference token structure.
              </p>
              <div className="text-sm text-brand-green font-semibold">
                Deliverable: 3 SACCOs onboarded
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-6 flex gap-6 items-start">
            <div className="w-16 h-16 bg-brand-blue rounded-full flex items-center justify-center text-neutral-900 font-bold flex-shrink-0">
              W4-6
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Member Rollout</h3>
              <p className="text-neutral-700">
                Upload first batch of member lists, approve 200+ members, distribute reference
                cards. Test USSD payment flows with pilot groups.
              </p>
              <div className="text-sm text-brand-green font-semibold">
                Deliverable: 200 members contributing via USSD
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-6 flex gap-6 items-start">
            <div className="w-16 h-16 bg-brand-green rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              W7-9
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Scale & Refine</h3>
              <p className="text-neutral-700">
                Expand to remaining groups. Refine SMS ingestion, allocation mapping, and statement
                exports. Address edge cases (dual-SIM, shared devices).
              </p>
              <div className="text-sm text-brand-green font-semibold">
                Deliverable: 500+ members, 15 groups active
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-6 flex gap-6 items-start">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-neutral-900 font-bold flex-shrink-0">
              W10-12
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Evaluation & Handoff</h3>
              <p className="text-neutral-700">
                Collect feedback from staff and members. Run final security audits. Export
                allocation reports. Document lessons learned for national rollout.
              </p>
              <div className="text-sm text-brand-green font-semibold">
                Deliverable: Pilot report, production readiness checklist
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="bg-white border border-neutral-200 rounded-xl p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center">Key Performance Indicators</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-bold text-lg">Success Metrics</h3>
            <ul className="space-y-2 text-neutral-700">
              <li className="flex gap-3">
                <span className="text-brand-green">✓</span>
                <span>&ge;500 members onboarded and active</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-green">✓</span>
                <span>&ge;80% USSD payment success rate</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-green">✓</span>
                <span>Zero data breaches or PII leaks</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-green">✓</span>
                <span>&ge;90% staff satisfaction (training + tools)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-green">✓</span>
                <span>&ge;85% member satisfaction (ease of use)</span>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="font-bold text-lg">Risk Mitigations</h3>
            <ul className="space-y-2 text-neutral-700">
              <li className="flex gap-3">
                <span className="text-brand-yellow">⚠</span>
                <span>Low USSD literacy → printed instruction cards</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-yellow">⚠</span>
                <span>Shared devices → token-scoped RLS</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-yellow">⚠</span>
                <span>Staff resistance → hands-on training + support</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-yellow">⚠</span>
                <span>Network outages → offline-first PWA fallback</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="bg-white border border-neutral-200 rounded-xl p-12 text-center space-y-6">
        <Calendar size={48} className="mx-auto text-brand-yellow" />
        <h2 className="text-3xl font-bold">Join the Pilot</h2>
        <p className="text-lg text-neutral-700 max-w-2xl mx-auto">
          Are you a SACCO staff member or district stakeholder in Nyamagabe? Contact us to be part
          of this 12-week sprint.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/contact"
            className="bg-white border border-neutral-200 rounded-xl px-8 py-4 font-semibold hover:bg-white/20 transition-all"
          >
            Contact Us
          </a>
          <a
            href="/saccos"
            className="bg-white border border-neutral-200 rounded-xl px-8 py-4 font-semibold hover:bg-white/20 transition-all"
          >
            Learn More About Staff Tools
          </a>
        </div>
      </section>
    </div>
  );
}
