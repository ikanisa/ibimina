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

export const metadata = {
  title: "Pay | SACCO+ Client",
  description: "Make payments to your ibimina groups",
};

// Mock data - replace with actual data fetching from Supabase
async function getPaymentInstructions() {
  // TODO: Fetch user's group memberships and generate USSD codes
  return [
    {
      id: "1",
      groupName: "Kigali Business Group",
      groupId: "group-1",
      saccoName: "Gasabo SACCO",
      merchantCode: "123456",
      reference: "NYA.GAS.KBG.001",
      ussdCode: "*182*8*1*123456*20000#",
      amount: 20000,
    },
    {
      id: "2",
      groupName: "Farmers Cooperative",
      groupId: "group-2",
      saccoName: "Kicukiro SACCO",
      merchantCode: "789012",
      reference: "NYA.KIC.FRM.002",
      ussdCode: "*182*8*1*789012*15000#",
      amount: 15000,
    },
  ];
}

export default async function PayPage() {
  const paymentInstructions = await getPaymentInstructions();

  const handlePaidClick = async () => {
    "use server";
    // TODO: Log payment pending flag to database
    console.log("Payment marked as pending");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Make a Payment</h1>
          <p className="text-sm text-gray-600 mt-1">Use USSD codes to contribute to your groups</p>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-8">
        {/* Help Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold text-blue-900">How to Pay</h2>
            <p className="text-xs text-blue-800 mt-1">
              Tap the green &quot;Dial to Pay&quot; button on any card below. Your phone will
              automatically dial the USSD code. Follow the prompts to complete your payment.
            </p>
          </div>
        </div>

        {/* Payment Instructions List */}
        {paymentInstructions.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-lg text-gray-600 mb-2">No payment instructions available</p>
            <p className="text-sm text-gray-500">Join a group to see payment instructions here</p>
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

        {/* General Help Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Need Help?</h2>

          <div className="space-y-3">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-gray-900 hover:text-blue-600 transition-colors">
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
              <p className="text-sm text-gray-600 mt-2">
                Make sure to use the SIM card that is registered with your Mobile Money account.
                Your phone may ask you to select which SIM to use when dialing the USSD code.
              </p>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-gray-900 hover:text-blue-600 transition-colors">
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
              <p className="text-sm text-gray-600 mt-2">
                Payment confirmations usually appear within a few minutes. You&apos;ll receive an
                SMS confirmation from your mobile money provider, and your statement will update
                automatically.
              </p>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-gray-900 hover:text-blue-600 transition-colors">
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
              <p className="text-sm text-gray-600 mt-2">
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
