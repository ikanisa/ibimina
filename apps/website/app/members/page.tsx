import { Phone, Copy, CheckCircle, HelpCircle, Smartphone, FileText } from "lucide-react";
import { PrintButton } from "@/components/PrintButton";

export const metadata = {
  title: "For Members",
  description: "How to contribute to your ibimina using USSD payments",
};

export default function MembersPage() {
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
          <div className="glass p-6 space-y-4">
            <div className="w-16 h-16 bg-rwyellow rounded-full flex items-center justify-center text-ink text-3xl font-bold">
              1
            </div>
            <h3 className="text-2xl font-bold">Get Your Reference</h3>
            <p className="opacity-90">
              Contact your SACCO staff to onboard and receive your reference token (e.g.,
              NYA.GAS.TWIZ.001). You&apos;ll need this for all payments.
            </p>
          </div>
          <div className="glass p-6 space-y-4">
            <div className="w-16 h-16 bg-rwblue rounded-full flex items-center justify-center text-ink text-3xl font-bold">
              2
            </div>
            <h3 className="text-2xl font-bold">Dial USSD</h3>
            <p className="opacity-90">
              Dial *182# on your phone. Enter your SACCO&apos;s merchant code and your reference
              token when prompted. Confirm the amount.
            </p>
          </div>
          <div className="glass p-6 space-y-4">
            <div className="w-16 h-16 bg-rwgreen rounded-full flex items-center justify-center text-white text-3xl font-bold">
              3
            </div>
            <h3 className="text-2xl font-bold">Confirm Payment</h3>
            <p className="opacity-90">
              You&apos;ll receive an SMS confirmation. Your payment goes directly to your
              SACCO&apos;s MoMo merchant account. Check your statement in the app.
            </p>
          </div>
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
            <span>Do I need a smartphone?</span>
          </summary>
          <p className="mt-4 opacity-90 pl-9">
            No! USSD works on any mobile phone. You don&apos;t need data or internet connection.
            Just dial *182# from your mobile money registered number.
          </p>
        </details>

        <details className="glass p-6">
          <summary className="text-xl font-bold cursor-pointer flex items-center gap-3">
            <HelpCircle size={24} />
            <span>What if I have dual SIM cards?</span>
          </summary>
          <p className="mt-4 opacity-90 pl-9">
            Make sure to use the SIM card that is registered with your Mobile Money account. When
            you dial the USSD code, your phone may ask you to select which SIM to use.
          </p>
        </details>

        <details className="glass p-6">
          <summary className="text-xl font-bold cursor-pointer flex items-center gap-3">
            <CheckCircle size={24} />
            <span>How long until I see my payment confirmed?</span>
          </summary>
          <p className="mt-4 opacity-90 pl-9">
            You&apos;ll receive an SMS confirmation from MoMo within seconds. Your statement in the
            SACCO+ app will update within a few minutes once staff map the payment to your
            reference.
          </p>
        </details>

        <details className="glass p-6">
          <summary className="text-xl font-bold cursor-pointer flex items-center gap-3">
            <FileText size={24} />
            <span>Can I see my payment history?</span>
          </summary>
          <p className="mt-4 opacity-90 pl-9">
            Yes! Once you&apos;re onboarded, you can view your allocation-based statements in the
            SACCO+ Client App. All your confirmed contributions will appear there.
          </p>
        </details>

        <details className="glass p-6">
          <summary className="text-xl font-bold cursor-pointer flex items-center gap-3">
            <Phone size={24} />
            <span>What if my device is shared with others?</span>
          </summary>
          <p className="mt-4 opacity-90 pl-9">
            No problem! Your reference token is personal to you. As long as you use your own Mobile
            Money account and reference token, your payments are tracked correctly.
          </p>
        </details>
      </section>

      {/* Printable USSD Guide */}
      <section className="glass p-8 space-y-4 print:break-after-page">
        <h2 className="text-2xl font-bold text-center">Printable USSD Instructions</h2>
        <p className="text-center opacity-90">Print this A4 card for easy reference</p>
        <div className="bg-white text-ink p-8 rounded-glass max-w-md mx-auto space-y-4">
          <h3 className="text-2xl font-bold text-center">SACCO+ USSD Payment</h3>
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span className="font-bold">1.</span>
              <span>Dial *182# from your Mobile Money registered phone number</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">2.</span>
              <span>Enter your SACCO&apos;s merchant code when prompted</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">3.</span>
              <span>Enter your reference token (e.g., NYA.GAS.TWIZ.001)</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">4.</span>
              <span>Enter the amount you want to contribute</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">5.</span>
              <span>Confirm with your Mobile Money PIN</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">6.</span>
              <span>Wait for SMS confirmation</span>
            </li>
          </ol>
          <div className="pt-4 border-t-2 border-ink/20 text-sm">
            <p className="font-bold">Need help?</p>
            <p>Contact your SACCO staff or visit saccoplus.rw/contact</p>
          </div>
        </div>
        <div className="text-center no-print">
          <PrintButton />
        </div>
      </section>
    </div>
  );
}
