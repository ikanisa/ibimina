import { CheckCircle, Users, Smartphone, Shield, BarChart3, Wifi } from "lucide-react";

export const metadata = {
  title: "Features",
  description: "Explore the comprehensive features of SACCO+ platform",
};

export default function FeaturesPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 leading-tight">
            Platform Features
          </h1>
          <p className="text-xl text-neutral-700 leading-relaxed max-w-2xl mx-auto">
            Comprehensive tools for digital ibimina management
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="max-w-5xl mx-auto space-y-8">
          <Section
            icon={<Users size={28} className="text-white" />}
            iconBg="bg-brand-yellow"
            title="Group Savings Management (Ibimina)"
            items={[
              "Create and manage multiple ikimina groups",
              "Track member contributions and allocations",
              "Automated contribution tracking",
              "Group performance dashboards",
              "Member roster management",
            ]}
          />

          <Section
            icon={<Smartphone size={28} className="text-white" />}
            iconBg="bg-brand-blue"
            title="Mobile Money Integration"
            items={[
              "Integration with MTN Mobile Money and Airtel Money",
              "Automated payment reconciliation",
              "SMS payment confirmations",
              "Reference token system for easy tracking",
              "USSD payment support",
            ]}
          />

          <Section
            icon={<CheckCircle size={28} className="text-white" />}
            iconBg="bg-brand-green"
            title="Member Portal"
            items={[
              "PWA and Android mobile app",
              "View contribution history",
              "Request loans",
              "Access statements",
              "Multi-language support (Kinyarwanda, English, French)",
            ]}
          />

          <Section
            icon={<Shield size={28} className="text-white" />}
            iconBg="bg-neutral-900"
            title="Security & Compliance"
            items={[
              "Role-based access control (RBAC)",
              "Multi-factor authentication (MFA)",
              "Comprehensive audit trails",
              "Data encryption at rest and in transit",
              "Row-level security policies",
            ]}
          />

          <Section
            icon={<BarChart3 size={28} className="text-white" />}
            iconBg="bg-info-600"
            title="Reporting & Analytics"
            items={[
              "Real-time dashboards",
              "Custom report generation",
              "Financial performance metrics",
              "Member activity tracking",
              "Export to PDF and CSV",
            ]}
          />

          <Section
            icon={<Wifi size={28} className="text-white" />}
            iconBg="bg-success-600"
            title="Offline-First Capability"
            items={[
              "Progressive Web App (PWA) support",
              "Offline data access",
              "Background sync when online",
              "Service worker caching",
              "Resilient to network issues",
            ]}
          />
        </div>
      </main>
    </div>
  );
}

function Section({
  icon,
  iconBg,
  title,
  items,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-8">
      <div className="flex items-start gap-6 mb-6">
        <div
          className={`w-14 h-14 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}
        >
          {icon}
        </div>
        <h2 className="text-3xl font-bold text-neutral-900 flex-1">{title}</h2>
      </div>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckCircle size={20} className="text-brand-green flex-shrink-0 mt-0.5" />
            <span className="text-neutral-700 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
