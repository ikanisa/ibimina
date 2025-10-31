import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Features",
  description: "Explore the comprehensive features of Ibimina SACCO management platform",
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-primary-600">
              Ibimina
            </Link>
            <Link
              href="/"
              className="inline-flex items-center text-gray-700 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Platform Features</h1>

          <div className="space-y-8">
            <Section
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
        </div>
      </main>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start">
            <span className="text-primary-600 mr-2">✓</span>
            <span className="text-gray-700">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
