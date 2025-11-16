import Link from "next/link";
import { Phone, Users, Shield, TrendingUp, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue/10 text-brand-blue rounded-full text-sm font-medium mb-4">
              <span className="w-2 h-2 bg-brand-blue rounded-full animate-pulse"></span>
              Piloting in Nyamagabe District
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-neutral-900 leading-tight tracking-tight">
              Digital Ibimina for <span className="gradient-text">Rwanda’s SACCOs</span>
            </h1>

            <p className="text-xl md:text-2xl text-neutral-700 leading-relaxed max-w-2xl mx-auto">
              USSD-first intermediation platform that digitizes savings groups without handling
              funds or requiring core integration.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link
                href="/members"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-neutral-900 text-white font-semibold rounded-lg hover:bg-neutral-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                For Members
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/saccos"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-neutral-300 text-neutral-900 font-semibold rounded-lg hover:bg-neutral-50 transition-all duration-200"
              >
                For SACCOs
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What We Solve */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">What We Solve</h2>
            <p className="text-lg text-neutral-700 max-w-2xl mx-auto">
              Three core principles that make SACCO+ different
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* USSD-First */}
            <div className="group bg-white border border-neutral-200 rounded-xl p-8 hover:shadow-xl hover:border-neutral-300 hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 bg-brand-yellow rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Phone size={28} className="text-neutral-900" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">USSD-First</h3>
              <p className="text-neutral-700 leading-relaxed">
                Members contribute via USSD on any phone. No smartphone required. Deposits go
                directly to SACCO MoMo merchant accounts.
              </p>
            </div>

            {/* Intermediation Only */}
            <div className="group bg-white border border-neutral-200 rounded-xl p-8 hover:shadow-xl hover:border-neutral-300 hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 bg-brand-blue rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">Intermediation Only</h3>
              <p className="text-neutral-700 leading-relaxed">
                SACCO+ never handles funds. We issue standardized references and produce
                allocation-based statements. Zero liability.
              </p>
            </div>

            {/* Staff Approved */}
            <div className="group bg-white border border-neutral-200 rounded-xl p-8 hover:shadow-xl hover:border-neutral-300 hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 bg-brand-green rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">Staff Approved</h3>
              <p className="text-neutral-700 leading-relaxed">
                All member onboarding and group creation is staff-controlled. Members request to
                join; staff approve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">How It Works</h2>
            <p className="text-lg text-neutral-700 max-w-2xl mx-auto">
              Three simple steps from onboarding to statements
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white border border-neutral-200 rounded-xl p-8">
                <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center text-neutral-900 text-2xl font-bold mb-6">
                  1
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Member Gets Reference</h3>
                <p className="text-neutral-700 leading-relaxed">
                  Staff onboard members and assign a structured reference token (e.g.,
                  NYA.GAS.TWIZ.001).
                </p>
              </div>
              {/* Connector line */}
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-neutral-300"></div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white border border-neutral-200 rounded-xl p-8">
                <div className="w-12 h-12 bg-brand-blue rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6">
                  2
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Dial USSD to Pay</h3>
                <p className="text-neutral-700 leading-relaxed">
                  Member dials *182# with merchant code + reference. Funds go directly to SACCO’s
                  MoMo merchant.
                </p>
              </div>
              {/* Connector line */}
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-neutral-300"></div>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-neutral-200 rounded-xl p-8">
              <div className="w-12 h-12 bg-brand-green rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">View Statement</h3>
              <p className="text-neutral-700 leading-relaxed">
                SACCO+ maps SMS confirmations to references. Members see allocation-based statements
                (read-only).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pilot CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-brand-blue to-brand-blue-dark rounded-2xl p-12 text-center text-white shadow-2xl">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
              <TrendingUp size={32} className="text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4">Pilot: Nyamagabe District</h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              We’re launching with Nyamagabe Umurenge SACCOs. 12 weeks to production. Join us to
              digitize ibimina for your community.
            </p>
            <Link
              href="/pilot-nyamagabe"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-blue font-semibold rounded-lg hover:bg-neutral-100 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Learn About the Pilot
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Key Stats */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white border border-neutral-200 rounded-xl p-6 text-center">
              <div className="text-5xl font-bold text-neutral-900 mb-2">416</div>
              <div className="text-sm text-neutral-700">Umurenge SACCOs</div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-6 text-center">
              <div className="text-5xl font-bold text-neutral-900 mb-2">2M+</div>
              <div className="text-sm text-neutral-700">Potential Members</div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-6 text-center">
              <div className="text-5xl font-bold text-neutral-900 mb-2">100%</div>
              <div className="text-sm text-neutral-700">USSD Coverage</div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-6 text-center">
              <div className="text-5xl font-bold text-neutral-900 mb-2">0</div>
              <div className="text-sm text-neutral-700">Funds Handled</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
