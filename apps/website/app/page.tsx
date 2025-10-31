import Link from "next/link";
import { Phone, Users, Shield, TrendingUp, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 space-y-24 pb-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <h1 className="text-5xl md:text-6xl font-bold leading-tight">
          Digital Ibimina for
          <br />
          <span className="text-rwyellow">Rwanda&apos;s SACCOs</span>
        </h1>
        <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
          SACCO+ digitizes ibimina savings groups with USSD-first contributions. No funds handling.
          No core integration. Just standardized references and allocation-based statements.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            href="/members"
            className="glass px-8 py-4 flex items-center gap-2 text-lg font-semibold hover:bg-white/20 transition-all"
          >
            For Members
            <ArrowRight size={20} />
          </Link>
          <Link
            href="/saccos"
            className="glass px-8 py-4 flex items-center gap-2 text-lg font-semibold hover:bg-white/20 transition-all"
          >
            For SACCOs
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* What We Solve */}
      <section className="space-y-8">
        <h2 className="text-4xl font-bold text-center">What We Solve</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass p-8 space-y-4">
            <div className="w-16 h-16 bg-rwyellow rounded-full flex items-center justify-center text-ink">
              <Phone size={32} />
            </div>
            <h3 className="text-2xl font-bold">USSD-First</h3>
            <p className="opacity-90">
              Members contribute via USSD on any phone. No smartphone required. Deposits go directly
              to SACCO MoMo merchant accounts.
            </p>
          </div>
          <div className="glass p-8 space-y-4">
            <div className="w-16 h-16 bg-rwblue rounded-full flex items-center justify-center text-ink">
              <Shield size={32} />
            </div>
            <h3 className="text-2xl font-bold">Intermediation Only</h3>
            <p className="opacity-90">
              SACCO+ never handles funds. We issue standardized references and produce
              allocation-based statements. Zero liability.
            </p>
          </div>
          <div className="glass p-8 space-y-4">
            <div className="w-16 h-16 bg-rwgreen rounded-full flex items-center justify-center text-white">
              <Users size={32} />
            </div>
            <h3 className="text-2xl font-bold">Staff Approved</h3>
            <p className="opacity-90">
              All member onboarding and group creation is staff-controlled. Members request to join;
              staff approve.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="space-y-8">
        <h2 className="text-4xl font-bold text-center">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass p-6 space-y-3">
            <div className="text-rwyellow text-6xl font-bold">1</div>
            <h3 className="text-xl font-bold">Member Gets Reference</h3>
            <p className="opacity-90">
              Staff onboard members and assign a structured reference token (e.g.,
              NYA.GAS.TWIZ.001).
            </p>
          </div>
          <div className="glass p-6 space-y-3">
            <div className="text-rwblue text-6xl font-bold">2</div>
            <h3 className="text-xl font-bold">Dial USSD to Pay</h3>
            <p className="opacity-90">
              Member dials *182# with merchant code + reference. Funds go directly to SACCO&apos;s
              MoMo merchant.
            </p>
          </div>
          <div className="glass p-6 space-y-3">
            <div className="text-rwgreen text-6xl font-bold">3</div>
            <h3 className="text-xl font-bold">View Statement</h3>
            <p className="opacity-90">
              SACCO+ maps SMS confirmations to references. Members see allocation-based statements
              (read-only).
            </p>
          </div>
        </div>
      </section>

      {/* Pilot CTA */}
      <section className="glass p-12 text-center space-y-6">
        <div className="w-20 h-20 bg-rwyellow rounded-full flex items-center justify-center text-ink mx-auto">
          <TrendingUp size={40} />
        </div>
        <h2 className="text-4xl font-bold">Pilot: Nyamagabe District</h2>
        <p className="text-xl opacity-90 max-w-2xl mx-auto">
          We&apos;re launching with Nyamagabe Umurenge SACCOs. 12 weeks to production. Join us to
          digitize ibimina for your community.
        </p>
        <Link
          href="/pilot-nyamagabe"
          className="inline-flex items-center gap-2 glass px-8 py-4 text-lg font-semibold hover:bg-white/20 transition-all"
        >
          Learn About the Pilot
          <ArrowRight size={20} />
        </Link>
      </section>

      {/* Key Stats */}
      <section className="grid md:grid-cols-4 gap-6">
        <div className="glass p-6 text-center">
          <div className="text-5xl font-bold text-rwyellow">416</div>
          <div className="text-sm opacity-90 mt-2">Umurenge SACCOs</div>
        </div>
        <div className="glass p-6 text-center">
          <div className="text-5xl font-bold text-rwblue">2M+</div>
          <div className="text-sm opacity-90 mt-2">Potential Members</div>
        </div>
        <div className="glass p-6 text-center">
          <div className="text-5xl font-bold text-rwgreen">100%</div>
          <div className="text-sm opacity-90 mt-2">USSD Coverage</div>
        </div>
        <div className="glass p-6 text-center">
          <div className="text-5xl font-bold text-white">0</div>
          <div className="text-sm opacity-90 mt-2">Funds Handled</div>
        </div>
      </section>
    </div>
  );
}
