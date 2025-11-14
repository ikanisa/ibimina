import { CheckCircle, Target, Globe, Code } from "lucide-react";

export const metadata = {
  title: "About",
  description: "Learn about SACCO+ digital ibimina platform",
};

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 leading-tight">
            About SACCO+
          </h1>
          <p className="text-xl text-neutral-700 leading-relaxed max-w-2xl mx-auto">
            Digital intermediation platform for Rwanda’s Umurenge SACCOs
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-16">
        {/* Introduction */}
        <section className="text-center max-w-3xl mx-auto">
          <p className="text-2xl text-neutral-700 leading-relaxed">
            SACCO+ is a comprehensive digital platform designed specifically for Rwanda’s Umurenge
            SACCOs, digitizing ibimina savings groups with zero liability.
          </p>
        </section>

        {/* Our Mission */}
        <section className="bg-white border border-neutral-200 rounded-xl p-8">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-14 h-14 bg-brand-blue rounded-xl flex items-center justify-center flex-shrink-0">
              <Target size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">Our Mission</h2>
              <p className="text-lg text-neutral-700 leading-relaxed">
                To empower Rwanda’s Umurenge SACCOs with modern technology that simplifies group
                savings management, improves operational efficiency, and enhances member experience
                through USSD-first, intermediation-only solutions.
              </p>
            </div>
          </div>
        </section>

        {/* What We Do */}
        <section className="bg-white border border-neutral-200 rounded-xl p-8">
          <h2 className="text-3xl font-bold text-neutral-900 mb-6">What We Do</h2>
          <p className="text-lg text-neutral-700 mb-6 leading-relaxed">
            SACCO+ provides a complete platform that enables SACCO staff to:
          </p>
          <ul className="space-y-3">
            {[
              "Manage multiple ikimina (group savings) efficiently",
              "Track member contributions and allocations in real-time",
              "Reconcile mobile money payments automatically using SMS ingestion",
              "Generate comprehensive reports and statements",
              "Provide members with self-service mobile access",
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <CheckCircle size={20} className="text-brand-green flex-shrink-0 mt-0.5" />
                <span className="text-neutral-700 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Built for Rwanda */}
        <section className="bg-white border border-neutral-200 rounded-xl p-8">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-14 h-14 bg-brand-green rounded-xl flex items-center justify-center flex-shrink-0">
              <Globe size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">Built for Rwanda</h2>
              <p className="text-lg text-neutral-700 mb-6 leading-relaxed">
                Understanding the unique context of Rwanda’s financial sector, SACCO+ is designed
                with local needs in mind:
              </p>
              <ul className="space-y-3">
                {[
                  "Multi-language support (Kinyarwanda, English, French)",
                  "Mobile money integration (MTN, Airtel)",
                  "Offline-first architecture for areas with limited connectivity",
                  "USSD payment support for feature phone users",
                  "Compliance with Rwandan financial regulations",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle size={20} className="text-brand-green flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Technology */}
        <section className="bg-white border border-neutral-200 rounded-xl p-8">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-14 h-14 bg-neutral-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <Code size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">Technology</h2>
              <p className="text-lg text-neutral-700 leading-relaxed">
                SACCO+ leverages modern cloud infrastructure and security best practices to deliver
                a reliable, scalable platform. Built on Next.js, React, and Supabase, the platform
                offers world-class performance with enterprise-grade security.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
