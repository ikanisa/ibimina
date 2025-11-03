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
  const tipList = [
    ...(contentPack.tips?.dualSim ?? []),
    ...(contentPack.tips?.networkIssues ?? []),
    ...(contentPack.tips?.marketDays ?? []),
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-16 pb-16">
      {/* Header */}
      <section className="text-center space-y-4">
        <h1 className="text-5xl font-bold">For Members</h1>
        <p className="text-xl opacity-90">
          Learn how to contribute to your ibimina savings group using USSD payments
        </p>
      </section>

      {/* 3-Step Contribute Guide */}
      <section id="ussd-guide" className="space-y-8">
        <h2 className="text-3xl font-bold text-center">How to Contribute (3 Steps)</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {contributeSteps.map((step, index) => (
            <div key={step} className="glass p-6 space-y-4">
              <div className="w-16 h-16 bg-rwyellow rounded-full flex items-center justify-center text-ink text-3xl font-bold">
                {index + 1}
              </div>
              <h3 className="text-2xl font-bold">{primaryProvider.name}</h3>
              <p className="opacity-90">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Reference Card Example */}
      <section className="glass p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center">Your Reference Card</h2>
        <div className="bg-white/10 border-2 border-white/30 rounded-glass p-8 max-w-md mx-auto">
          <div className="space-y-4">
            <div>
              <div className="text-sm opacity-80">SACCO Merchant Code</div>
              <div className="text-3xl font-bold tracking-wider flex items-center gap-3">
                123456
                <button className="glass p-2" aria-label="Copy merchant code">
                  <Copy size={20} />
                </button>
              </div>
            </div>
            <div>
              <div className="text-sm opacity-80">Your Reference Token</div>
              <div className="text-3xl font-bold tracking-wider flex items-center gap-3">
                NYA.GAS.TWIZ.001
                <button className="glass p-2" aria-label="Copy reference token">
                  <Copy size={20} />
                </button>
              </div>
            </div>
            <div className="pt-4 border-t border-white/20 text-sm opacity-90">
              <div className="flex items-start gap-2">
                <Phone size={16} className="mt-1 flex-shrink-0" />
                <span>Use this reference for all USSD payments to your ibimina group.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="space-y-6">
        <h2 className="text-3xl font-bold text-center">Common Questions</h2>

        <details className="glass p-6">
          <summary className="text-xl font-bold cursor-pointer flex items-center gap-3">
            <Smartphone size={24} />
            <span>Payment guide</span>
          </summary>
          <ul className="mt-4 space-y-2 opacity-90 pl-9 list-disc">
            {paymentGuide.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>

        <details className="glass p-6">
          <summary className="text-xl font-bold cursor-pointer flex items-center gap-3">
            <HelpCircle size={24} />
            <span>Troubleshooting</span>
          </summary>
          <ul className="mt-4 space-y-2 opacity-90 pl-9 list-disc">
            {troubleshooting.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>

        <details className="glass p-6">
          <summary className="text-xl font-bold cursor-pointer flex items-center gap-3">
            <CheckCircle size={24} />
            <span>Tips for reliable payments</span>
          </summary>
          <ul className="mt-4 space-y-2 opacity-90 pl-9 list-disc">
            {tipList.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      </section>

      {/* Printable USSD Guide */}
      <section className="glass p-8 space-y-4 print:break-after-page">
        <h2 className="text-2xl font-bold text-center">Printable USSD Instructions</h2>
        <p className="text-center opacity-90">Print this A4 card for easy reference</p>
        <div className="bg-white text-ink p-8 rounded-glass max-w-md mx-auto space-y-4">
          <h3 className="text-2xl font-bold text-center">SACCO+ USSD Payment</h3>
          <ol className="space-y-3">
            {printableInstructions.map((instruction, index) => (
              <li key={instruction} className="flex gap-3">
                <span className="font-bold">{index + 1}.</span>
                <span>{instruction}</span>
              </li>
            ))}
          </ol>
          <div className="pt-4 border-t-2 border-ink/20 text-sm">
            <p className="font-bold">Need help?</p>
            <p>
              Contact your SACCO staff or call{" "}
              {contentPack.help.contactInfo.helpline ?? "your SACCO"}
            </p>
          </div>
        </div>
        <div className="text-center no-print">
          <PrintButton />
        </div>
      </section>

      <section className="glass p-6 space-y-3">
        <h2 className="text-2xl font-bold text-center">General Reminders</h2>
        <ul className="list-disc pl-6 space-y-2">
          {generalReminders.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
