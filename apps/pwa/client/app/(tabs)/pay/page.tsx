/**
 * Pay Page - USSD Payment Instructions
 *
 * Displays USSD payment sheets for all user's groups with merchant codes,
 * reference tokens, and tap-to-dial functionality.
 */

import { AlertCircle } from "lucide-react";

import { UssdSheet } from "@/components/ussd/ussd-sheet";
import { loadPaySheet } from "@/lib/data/pay";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const metadata = {
  title: "Pay | SACCO+ Client",
  description: "Make payments to your ibimina groups",
};

async function markPaymentIntent(referenceToken: string) {
  "use server";

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("member_reference_tokens")
    .select("token")
    .eq("token", referenceToken)
    .maybeSingle();

  if (error || !data) {
    console.error("Unable to verify reference token", error);
    throw new Error("We could not verify your reference token. Please try again.");
  }

  try {
    await supabase.rpc("record_payment_intent", {
      reference_token: referenceToken,
    });
  } catch (rpcError) {
    console.warn("record_payment_intent RPC unavailable", rpcError);
  }

  revalidatePath("/statements");
}

export default async function PayPage() {
  const { instructions } = await loadPaySheet();

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-neutral-900">Make a Payment</h1>
          <p className="text-sm text-neutral-700 mt-1">
            Dial the USSD code to contribute to your groups
          </p>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-8">
        <div className="bg-atlas-glow border border-atlas-blue/20 rounded-2xl p-5 flex items-start gap-3">
          <AlertCircle
            className="w-5 h-5 text-atlas-blue flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-sm font-semibold text-atlas-blue-dark">How to pay</h2>
            <p className="text-sm text-neutral-700 mt-1.5 leading-relaxed">
              Tap the green "Dial to pay" button on any card below. Your phone will dial the USSD
              code. Follow the prompts and use your reference code to complete the payment.
            </p>
          </div>
        </div>

        {instructions.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center">
            <p className="text-lg font-semibold text-neutral-700 mb-2">
              No payment instructions available
            </p>
            <p className="text-sm text-neutral-700">
              Join a group to see payment instructions here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {instructions.map((instruction) => (
              <UssdSheet
                key={instruction.id}
                merchantCode={instruction.merchantCode}
                reference={instruction.referenceToken}
                ussdCode={instruction.ussdCode}
                amount={instruction.amount}
                groupName={instruction.groupName}
                saccoName={instruction.saccoName ?? ""}
                onPaidClick={() => markPaymentIntent(instruction.referenceToken)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
