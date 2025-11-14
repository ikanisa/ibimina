import { Phone, Copy, CheckCircle, HelpCircle, Smartphone } from "lucide-react";
import { PrintButton } from "@/components/PrintButton";
import { getWebsiteContentPack } from "@/lib/content";

export const metadata = {
  title: "For Members",
  description: "How to contribute to your ibimina using USSD payments",
};

export default function MembersPage() {
  const contentPack = getWebsiteContentPack();
  const primaryProvider = contentPack.ussd.providers[0];
  const contributeSteps = primaryProvider.instructions.slice(0, 3);
  const printableInstructions = primaryProvider.instructions;
  const generalReminders = contentPack.ussd.generalInstructions;
  const troubleshooting = contentPack.help.troubleshooting;
  const paymentGuide = contentPack.help.paymentGuide;

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 leading-tight">
            For Members
          </h1>
          <p className="text-xl text-neutral-700 leading-relaxed max-w-2xl mx-auto">
            Learn how to contribute to your ibimina savings group using USSD payments—no smartphone
            required
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-20">
        {/* 3-Step Guide */}
        <section id="ussd-guide">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">How to Contribute</h2>
            <p className="text-lg text-neutral-700">Three simple steps using any mobile phone</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {contributeSteps.map((step, index) => (
              <div
                key={step}
                className="bg-white border border-neutral-200 rounded-xl p-8 hover:shadow-lg transition-all duration-200"
              >
                <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center text-neutral-900 text-2xl font-bold mb-6">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">{primaryProvider.name}</h3>
                <p className="text-neutral-700 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Reference Card Example */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Your Reference Card</h2>
            <p className="text-lg text-neutral-700">
              Keep this information handy when making payments
            </p>
          </div>

          <div className="bg-gradient-to-br from-brand-blue to-brand-blue-dark rounded-2xl p-1 max-w-md mx-auto">
            <div className="bg-white rounded-xl p-8 space-y-6">
              <div>
                <div className="text-sm font-medium text-neutral-700 mb-2">SACCO Merchant Code</div>
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="text-3xl font-bold text-neutral-900 tracking-wider">123456</div>
                  <button
                    className="p-2 hover:bg-neutral-200 rounded-lg transition-colors"
                    aria-label="Copy merchant code"
                  >
                    <Copy size={20} className="text-neutral-700" />
                  </button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-neutral-700 mb-2">
                  Your Reference Token
                </div>
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="text-2xl font-bold text-neutral-900 tracking-wider">
                    NYA.GAS.TWIZ.001
                  </div>
                  <button
                    className="p-2 hover:bg-neutral-200 rounded-lg transition-colors"
                    aria-label="Copy reference token"
                  >
                    <Copy size={20} className="text-neutral-700" />
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex items-start gap-3 text-sm text-neutral-700">
                <Phone size={16} className="mt-0.5 flex-shrink-0" />
                <span>Use this reference for all USSD payments to your ibimina group.</span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section id="faq">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Common Questions</h2>
            <p className="text-lg text-neutral-700">
              Everything you need to know about making payments
            </p>
          </div>

          <div className="space-y-4">
            <details className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <summary className="flex items-center gap-3 cursor-pointer font-semibold text-lg text-neutral-900 list-none">
                <Smartphone size={24} className="text-brand-blue flex-shrink-0" />
                <span className="flex-1">Payment Guide</span>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <ul className="mt-6 space-y-3 pl-9 text-neutral-700">
                {paymentGuide.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle size={20} className="text-brand-green flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </details>

            <details className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <summary className="flex items-center gap-3 cursor-pointer font-semibold text-lg text-neutral-900 list-none">
                <HelpCircle size={24} className="text-brand-blue flex-shrink-0" />
                <span className="flex-1">Troubleshooting</span>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <ul className="mt-6 space-y-3 pl-9 text-neutral-700">
                {troubleshooting.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle size={20} className="text-warning-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </section>

        {/* Printable Guide */}
        <section className="print:break-after-page">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Printable Instructions</h2>
            <p className="text-lg text-neutral-700">Download or print for easy reference</p>
          </div>

          <div className="bg-white border-2 border-neutral-300 rounded-xl p-8 max-w-md mx-auto print:border-neutral-900">
            <div className="space-y-6 print:text-neutral-900">
              <div className="text-center border-b-2 border-neutral-200 pb-6 print:border-neutral-900">
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">SACCO+ USSD Payment</h3>
                <p className="text-sm text-neutral-700 print:text-neutral-900">
                  Quick Reference Guide
                </p>
              </div>

              <ol className="space-y-4">
                {printableInstructions.map((instruction, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="font-bold text-neutral-900 flex-shrink-0">{index + 1}.</span>
                    <span className="text-neutral-700 print:text-neutral-900">{instruction}</span>
                  </li>
                ))}
              </ol>

              <div className="pt-6 border-t-2 border-neutral-200 text-sm print:border-neutral-900">
                <p className="font-semibold text-neutral-900 mb-2">Need help?</p>
                <p className="text-neutral-700 print:text-neutral-900">
                  Contact your SACCO staff or call{" "}
                  {contentPack.help.contactInfo.helpline ?? "your SACCO"}
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-8 no-print">
            <PrintButton />
          </div>
        </section>

        {/* General Reminders */}
        <section className="bg-neutral-50 rounded-2xl p-8 border border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Important Reminders</h2>
          <ul className="space-y-3">
            {generalReminders.map((reminder, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <CheckCircle size={20} className="text-brand-green flex-shrink-0 mt-0.5" />
                <span className="text-neutral-700">{reminder}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
