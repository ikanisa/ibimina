/**
 * Pay Page - USSD Payment Instructions
 *
 * Displays USSD payment sheets for all user's groups with merchant codes,
 * reference tokens, and tap-to-dial functionality.
 *
 * Features:
 * - USSD sheets for each group membership
 * - Tap-to-dial USSD codes
 * - Copy merchant codes and references
 * - 3-step payment guide
 * - Dual-SIM tips
 */

import { UssdSheet } from "@/components/ussd/ussd-sheet";
import { AlertCircle } from "lucide-react";
import { mockGroups } from "@/utils/mock";

export const metadata = {
  title: "Pay | SACCO+ Client",
  description: "Make payments to your ibimina groups",
};

// Mock data - replace with actual data fetching from Supabase
async function getPaymentInstructions() {
  // TODO: Fetch user's group memberships and generate USSD codes
  return mockGroups.map((group) => ({
    id: group.id,
    groupName: group.name,
    groupId: group.id,
    saccoName: group.saccoName,
    merchantCode: group.merchantCode,
    reference: group.reference,
    ussdCode: `*182*8*1*${group.merchantCode}*${group.defaultContribution}#`,
    amount: group.defaultContribution,
  }));
}

export default async function PayPage() {
  const paymentInstructions = await getPaymentInstructions();

  const handlePaidClick = async () => {
    "use server";
    // TODO: Log payment pending flag to database
    console.log("Payment marked as pending");
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Header - Atlas redesigned */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-neutral-900">Make a Payment</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Use USSD codes to contribute to your groups
          </p>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-8">
        {/* Help Banner - Atlas redesigned */}
        <div className="bg-atlas-glow border border-atlas-blue/20 rounded-2xl p-5 flex items-start gap-3">
          <AlertCircle
            className="w-5 h-5 text-atlas-blue flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-sm font-semibold text-atlas-blue-dark">How to Pay</h2>
            <p className="text-sm text-neutral-700 mt-1.5 leading-relaxed">
              Tap the green &quot;Dial to Pay&quot; button on any card below. Your phone will
              automatically dial the USSD code. Follow the prompts to complete your payment.
            </p>
          </div>
        </div>

        {/* Payment Instructions List */}
        {paymentInstructions.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center">
            <p className="text-lg font-semibold text-neutral-700 mb-2">
              No payment instructions available
            </p>
            <p className="text-sm text-neutral-600">
              Join a group to see payment instructions here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {paymentInstructions.map((instruction) => (
              <UssdSheet
                key={instruction.id}
                merchantCode={instruction.merchantCode}
                reference={instruction.reference}
                ussdCode={instruction.ussdCode}
                amount={instruction.amount}
                groupName={instruction.groupName}
                saccoName={instruction.saccoName}
                onPaidClick={handlePaidClick}
              />
            ))}
          </div>
        )}

        {/* General Help Section - Atlas redesigned */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-neutral-900">Need Help?</h2>

          <div className="space-y-3">
            <details className="group pb-3 border-b border-neutral-100 last:border-0 last:pb-0">
              <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-neutral-900 hover:text-atlas-blue transition-colors">
                <span>What if I have multiple SIM cards?</span>
                <span className="transition group-open:rotate-180">
                  <svg
                    fill="none"
                    height="24"
                    shapeRendering="geometricPrecision"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    width="24"
                  >
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                </span>
              </summary>
              <p className="mt-2 text-sm text-neutral-600">
                Make sure to use the SIM card that is registered with your Mobile Money account.
                Your phone may ask you to select which SIM to use when dialing the USSD code.
              </p>
            </details>

            <details className="group pb-3 border-b border-neutral-100 last:border-0 last:pb-0">
              <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-neutral-900 hover:text-atlas-blue transition-colors">
                <span>How long does it take to confirm?</span>
                <span className="transition group-open:rotate-180">
                  <svg
                    fill="none"
                    height="24"
                    shapeRendering="geometricPrecision"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    width="24"
                  >
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                </span>
              </summary>
              <p className="text-sm text-neutral-600 mt-3 leading-relaxed">
                Payment confirmations usually appear within a few minutes. You&apos;ll receive an
                SMS confirmation from your mobile money provider, and your statement will update
                automatically.
              </p>
            </details>

            <details className="group pb-3 border-b border-neutral-100 last:border-0 last:pb-0">
              <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-neutral-900 hover:text-atlas-blue transition-colors">
                <span>What if the USSD code doesn&apos;t work?</span>
                <span className="transition group-open:rotate-180">
                  <svg
                    fill="none"
                    height="24"
                    shapeRendering="geometricPrecision"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    width="24"
                  >
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                </span>
              </summary>
              <p className="mt-2 text-sm text-neutral-600">
                If the tap-to-dial doesn&apos;t work, you can manually dial the USSD code from your
                phone&apos;s dialer. Copy the merchant code and reference code from the card above.
              </p>
            </details>
          </div>
        </div>
      </main>
    </div>
  );
}
