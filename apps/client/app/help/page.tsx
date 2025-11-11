import Link from "next/link";
import { HelpCircle, MessageCircle, Phone, FileText } from "lucide-react";

export const metadata = {
  title: "Help & Support | SACCO+ Client",
  description: "Get help with your SACCO+ account",
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <header className="relative bg-gradient-to-br from-atlas-blue via-atlas-blue-light to-atlas-blue-dark px-4 py-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="relative mx-auto max-w-screen-xl">
          <h1 className="mb-2 text-3xl font-bold text-white drop-shadow-sm">Help & Support</h1>
          <p className="text-base text-white drop-shadow-sm">Find answers and get assistance</p>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl space-y-6 px-4 py-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/help/faq"
            className="group rounded-2xl border border-neutral-200 bg-white p-6 transition-all duration-interactive hover:border-atlas-blue/30 hover:shadow-atlas hover:-translate-y-0.5"
          >
            <HelpCircle className="mb-4 h-8 w-8 text-atlas-blue" />
            <h2 className="mb-2 text-xl font-bold text-neutral-900 group-hover:text-atlas-blue">
              Frequently Asked Questions
            </h2>
            <p className="text-neutral-700">
              Find quick answers to common questions about payments, groups, and more
            </p>
          </Link>

          <Link
            href="/help/contact"
            className="group rounded-2xl border border-neutral-200 bg-white p-6 transition-all duration-interactive hover:border-atlas-blue/30 hover:shadow-atlas hover:-translate-y-0.5"
          >
            <MessageCircle className="mb-4 h-8 w-8 text-emerald-600" />
            <h2 className="mb-2 text-xl font-bold text-neutral-900 group-hover:text-atlas-blue">
              Contact Support
            </h2>
            <p className="text-neutral-700">
              Get in touch with our support team for personalized assistance
            </p>
          </Link>

          <Link
            href="/support"
            className="group rounded-2xl border border-neutral-200 bg-white p-6 transition-all duration-interactive hover:border-atlas-blue/30 hover:shadow-atlas hover:-translate-y-0.5"
          >
            <Phone className="mb-4 h-8 w-8 text-atlas-blue" />
            <h2 className="mb-2 text-xl font-bold text-neutral-900 group-hover:text-atlas-blue">
              AI Assistant
            </h2>
            <p className="text-neutral-700">
              Chat with our AI assistant for instant help with your account
            </p>
          </Link>

          <Link
            href="/profile"
            className="group rounded-2xl border border-neutral-200 bg-white p-6 transition-all duration-interactive hover:border-atlas-blue/30 hover:shadow-atlas hover:-translate-y-0.5"
          >
            <FileText className="mb-4 h-8 w-8 text-neutral-700" />
            <h2 className="mb-2 text-xl font-bold text-neutral-900 group-hover:text-atlas-blue">
              View Profile
            </h2>
            <p className="text-neutral-700">
              Access your contact information and SACCO staff details
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
