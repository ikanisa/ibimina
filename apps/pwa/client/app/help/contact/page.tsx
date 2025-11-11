import Link from "next/link";
import { ChevronLeft, Phone, MessageCircle, Mail, MapPin } from "lucide-react";

export const metadata = {
  title: "Contact Support | SACCO+ Client",
  description: "Get in touch with our support team",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <header className="bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-screen-xl px-4 py-4">
          <Link
            href="/help"
            className="inline-flex items-center gap-2 text-atlas-blue hover:text-atlas-blue-dark transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Help</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-neutral-900">Contact Support</h1>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl space-y-6 px-4 py-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-bold text-neutral-900">Get in Touch</h2>
          <p className="mb-6 text-neutral-700">
            Our support team is here to help you with any questions or issues you may have.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Phone className="mt-1 h-5 w-5 flex-shrink-0 text-atlas-blue" />
              <div>
                <p className="font-semibold text-neutral-900">Phone Support</p>
                <p className="text-neutral-700">+250 788 000 000</p>
                <p className="text-sm text-neutral-700">Mon-Fri: 8:00 AM - 5:00 PM EAT</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <MessageCircle className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-600" />
              <div>
                <p className="font-semibold text-neutral-900">WhatsApp</p>
                <p className="text-neutral-700">+250 788 000 000</p>
                <p className="text-sm text-neutral-700">Available 24/7</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Mail className="mt-1 h-5 w-5 flex-shrink-0 text-atlas-blue" />
              <div>
                <p className="font-semibold text-neutral-900">Email</p>
                <p className="text-neutral-700">support@ibimina.rw</p>
                <p className="text-sm text-neutral-700">Response within 24 hours</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-neutral-700" />
              <div>
                <p className="font-semibold text-neutral-900">Visit Your SACCO Office</p>
                <p className="text-neutral-700">
                  Contact your local SACCO branch for in-person support
                </p>
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/support"
          className="block rounded-2xl border border-atlas-blue/30 bg-atlas-glow p-6 text-center transition-all hover:border-atlas-blue hover:shadow-atlas"
        >
          <h3 className="mb-2 text-lg font-bold text-atlas-blue">Try Our AI Assistant</h3>
          <p className="text-neutral-700">Get instant answers to common questions</p>
        </Link>
      </main>
    </div>
  );
}
