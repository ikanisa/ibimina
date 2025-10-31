import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "About",
  description: "Learn about Ibimina SACCO management platform",
};

export default function AboutPage() {
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">About Ibimina</h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-600 mb-6">
            Ibimina is a comprehensive SACCO management platform designed specifically for
            Rwanda&apos;s Umurenge SACCOs.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Mission</h2>
          <p className="text-gray-700 mb-6">
            To empower Rwanda&apos;s Umurenge SACCOs with modern technology that simplifies group
            savings management, improves operational efficiency, and enhances member experience
            through mobile-first solutions.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">What We Do</h2>
          <p className="text-gray-700 mb-4">
            Ibimina provides a complete platform that enables SACCO staff to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
            <li>Manage multiple ikimina (group savings) efficiently</li>
            <li>Track member contributions and allocations in real-time</li>
            <li>Reconcile mobile money payments automatically using SMS ingestion</li>
            <li>Generate comprehensive reports and statements</li>
            <li>Provide members with self-service mobile access</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Built for Rwanda</h2>
          <p className="text-gray-700 mb-6">
            Understanding the unique context of Rwanda&apos;s financial sector, Ibimina is designed
            with local needs in mind:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
            <li>Multi-language support (Kinyarwanda, English, French)</li>
            <li>Mobile money integration (MTN, Airtel)</li>
            <li>Offline-first architecture for areas with limited connectivity</li>
            <li>USSD payment support for feature phone users</li>
            <li>Compliance with Rwandan financial regulations</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Technology</h2>
          <p className="text-gray-700 mb-6">
            Ibimina leverages modern cloud infrastructure and security best practices to deliver a
            reliable, scalable platform. Built on Next.js, React, and Supabase, the platform offers
            world-class performance with enterprise-grade security.
          </p>
        </div>
      </main>
    </div>
  );
}
