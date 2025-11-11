/**
 * USSD Sheet Component
 *
 * Displays payment instructions with USSD codes, merchant details, and reference tokens.
 * Provides tap-to-dial functionality and copy-to-clipboard for payment references.
 *
 * Features:
 * - Merchant code display with copy functionality
 * - Structured reference token with QR code
 * - Tap-to-dial USSD button (tel: protocol)
 * - 3-step checklist with large icons
 * - "I've paid" button to log pending flag
 * - Dual-SIM tips
 * - High contrast, large type (mobile-first)
 */

"use client";

import { useState } from "react";
import { Copy, Check, Phone, CheckCircle2, AlertCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics/track";
import { fmtCurrency } from "@/utils/format";

interface UssdSheetProps {
  merchantCode: string;
  reference: string;
  ussdCode: string;
  amount: number;
  groupName: string;
  saccoName: string;
  onPaidClick?: () => void;
}

export function UssdSheet({
  merchantCode,
  reference,
  ussdCode,
  amount,
  groupName,
  saccoName,
  onPaidClick,
}: UssdSheetProps) {
  const [copiedMerchant, setCopiedMerchant] = useState(false);
  const [copiedReference, setCopiedReference] = useState(false);
  const [copiedUssd, setCopiedUssd] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [showDialError, setShowDialError] = useState(false);

  const handleCopy = async (text: string, type: "merchant" | "reference") => {
    try {
      await navigator.clipboard.writeText(text);

      if (type === "merchant") {
        setCopiedMerchant(true);
        setTimeout(() => setCopiedMerchant(false), 2000);
      } else {
        setCopiedReference(true);
        setTimeout(() => setCopiedReference(false), 2000);
      }

      // Haptic feedback if available
      if ("vibrate" in navigator) {
        navigator.vibrate(50);
      }

      trackEvent("mobile_ussd_copy", {
        field: type,
        amount,
        group: groupName,
        sacco: saccoName,
        hasAmount: Boolean(amount),
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      trackEvent("mobile_ussd_copy_failed", {
        field: type,
        group: groupName,
        sacco: saccoName,
      });
    }
  };

  const handlePaidClick = () => {
    setIsPending(true);
    if (onPaidClick) {
      onPaidClick();
    }
    trackEvent("mobile_ussd_paid_marked", {
      group: groupName,
      sacco: saccoName,
      amount,
    });
  };

  const handleDialClick = async (_e: React.MouseEvent<HTMLAnchorElement>) => {
    // Try to dial, but handle failure gracefully
    trackEvent("mobile_ussd_dial_attempt", {
      group: groupName,
      sacco: saccoName,
      hasAmount: Boolean(amount),
    });

    // Set a timeout to check if dial worked
    setTimeout(async () => {
      // If user is still on page after 2s, dial likely failed
      // Auto-copy USSD code as fallback
      try {
        await navigator.clipboard.writeText(ussdCode);
        setCopiedUssd(true);
        setShowDialError(true);

        // Haptic feedback
        if ("vibrate" in navigator) {
          navigator.vibrate([50, 100, 50]);
        }

        trackEvent("mobile_ussd_dial_fallback_copy", {
          group: groupName,
          sacco: saccoName,
        });

        // Hide the success message after 5 seconds
        setTimeout(() => {
          setCopiedUssd(false);
        }, 5000);
      } catch (error) {
        console.error("Failed to copy USSD code:", error);
        setShowDialError(true);
      }
    }, 2000);
  };

  // Format amount with RWF currency
  const formattedAmount = fmtCurrency(amount);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-atlas border border-neutral-200 overflow-hidden hover:shadow-atlas-lg hover:border-atlas-blue/20 transition-all duration-interactive">
      {/* Header - Atlas redesigned */}
      <div className="relative bg-gradient-to-br from-atlas-blue via-atlas-blue-light to-atlas-blue-dark px-6 py-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
        <div className="relative">
          <h2 className="text-xl font-bold mb-2 tracking-tight">Payment Instructions</h2>
          <p className="text-white/90 text-sm font-medium">
            {groupName} • {saccoName}
          </p>
          <p className="text-3xl sm:text-4xl font-bold mt-4 tracking-tight">{formattedAmount}</p>
        </div>
      </div>

      {/* Content - Atlas redesigned */}
      <div className="p-6 space-y-6">
        {/* Merchant Code - Atlas redesigned */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
            Merchant Code
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl">
              <code className="text-lg font-mono font-bold text-neutral-900">{merchantCode}</code>
            </div>
            <button
              onClick={() => handleCopy(merchantCode, "merchant")}
              className="min-w-[52px] min-h-[52px] flex items-center justify-center px-4 py-3.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-xl transition-all duration-interactive focus:outline-none focus:ring-2 focus:ring-atlas-blue/30 focus:ring-offset-2"
              aria-label={copiedMerchant ? "Merchant code copied" : "Copy merchant code"}
            >
              {copiedMerchant ? (
                <Check className="w-5 h-5 text-emerald-600" aria-hidden="true" />
              ) : (
                <Copy className="w-5 h-5 text-neutral-700" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Reference Token - Atlas redesigned */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
            Reference Code
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3.5 bg-atlas-glow border border-atlas-blue/20 rounded-xl">
              <code className="text-lg font-mono font-bold text-atlas-blue-dark">{reference}</code>
            </div>
            <button
              onClick={() => handleCopy(reference, "reference")}
              className="min-w-[52px] min-h-[52px] flex items-center justify-center px-4 py-3.5 bg-atlas-glow hover:bg-atlas-blue/10 border border-atlas-blue/30 rounded-xl transition-all duration-interactive focus:outline-none focus:ring-2 focus:ring-atlas-blue/30 focus:ring-offset-2"
              aria-label={copiedReference ? "Reference code copied" : "Copy reference code"}
            >
              {copiedReference ? (
                <Check className="w-5 h-5 text-emerald-600" aria-hidden="true" />
              ) : (
                <Copy className="w-5 h-5 text-atlas-blue" aria-hidden="true" />
              )}
            </button>
          </div>
          <p className="text-xs text-neutral-700">Use this reference when making your payment</p>
        </div>

        {/* Tap-to-Dial USSD Button - Atlas redesigned */}
        <div className="space-y-3">
          <a
            href={`tel:${encodeURIComponent(ussdCode)}`}
            onClick={handleDialClick}
            className="flex items-center justify-center gap-3 w-full min-h-[60px] px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-xl shadow-atlas hover:shadow-atlas-lg hover:shadow-emerald-600/20 transition-all duration-interactive focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2"
            aria-label={`Dial USSD code ${ussdCode} to make payment`}
          >
            <Phone className="w-6 h-6" aria-hidden="true" />
            <span>Dial to Pay: {ussdCode}</span>
          </a>
          <p className="text-xs text-neutral-700 text-center font-medium">
            Tap the button above to dial the USSD code automatically
          </p>
        </div>

        {/* USSD Dial Recovery - P0 Fix H9.4 */}
        {(showDialError || copiedUssd) && (
          <div
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3 animate-slide-down"
            role="alert"
          >
            {copiedUssd ? (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className="w-5 h-5 text-emerald-600 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-semibold text-emerald-800">USSD Code Copied!</p>
                </div>
                <p className="text-sm text-emerald-700 leading-relaxed">
                  The code <code className="font-mono font-bold">{ussdCode}</code> has been copied
                  to your clipboard. Open your phone dialer, paste the code, and press call to
                  complete your payment.
                </p>
                <div className="pt-2 border-t border-emerald-200">
                  <p className="text-xs text-emerald-700">
                    <strong>How to paste:</strong> In your phone dialer, long-press the number field
                    and select "Paste"
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <AlertCircle
                    className="w-5 h-5 text-amber-600 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-semibold text-amber-800">Manual Dialing Needed</p>
                </div>
                <p className="text-sm text-amber-700 leading-relaxed">
                  Automatic dialing isn't available. Please open your phone dialer and enter:{" "}
                  <code className="font-mono font-bold">{ussdCode}</code>
                </p>
                <button
                  onClick={() => handleCopy(ussdCode, "merchant")}
                  className="w-full px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  Copy USSD Code
                </button>
              </>
            )}
          </div>
        )}

        {/* 3-Step Checklist - Atlas redesigned */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 space-y-4">
          <h3 className="text-base font-bold text-neutral-900 mb-3">How to Pay (3 Steps)</h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-atlas-glow border border-atlas-blue/20 flex items-center justify-center">
                <span className="text-sm font-bold text-atlas-blue">1</span>
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm font-semibold text-neutral-900">Dial the USSD code</p>
                <p className="text-xs text-neutral-700 mt-1.5 leading-relaxed">
                  Tap the green button above or dial manually
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-atlas-glow border border-atlas-blue/20 flex items-center justify-center">
                <span className="text-sm font-bold text-atlas-blue">2</span>
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm font-semibold text-neutral-900">Enter the reference code</p>
                <p className="text-xs text-neutral-700 mt-1.5 leading-relaxed">
                  Copy the reference code above and paste it when prompted
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-atlas-glow border border-atlas-blue/20 flex items-center justify-center">
                <span className="text-sm font-bold text-atlas-blue">3</span>
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm font-semibold text-neutral-900">Confirm the payment</p>
                <p className="text-xs text-neutral-700 mt-1.5 leading-relaxed">
                  You&apos;ll receive a confirmation SMS
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* I've Paid Button - Atlas redesigned */}
        <button
          onClick={handlePaidClick}
          disabled={isPending}
          className={`
            w-full min-h-[56px] px-6 py-3.5 rounded-xl font-semibold text-base
            transition-all duration-interactive focus:outline-none focus:ring-2 focus:ring-offset-2
            ${
              isPending
                ? "bg-amber-50 text-amber-800 border-2 border-amber-200 cursor-not-allowed"
                : "bg-atlas-blue hover:bg-atlas-blue-dark text-white hover:shadow-atlas hover:shadow-atlas-blue/20 focus:ring-atlas-blue/30"
            }
          `}
          aria-label={isPending ? "Payment marked as pending" : "Mark payment as made"}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5" aria-hidden="true" />
              <span>Payment Pending Confirmation</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
              <span>I&apos;ve Made the Payment</span>
            </span>
          )}
        </button>

        {isPending && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4" role="status">
            <p className="text-sm text-amber-800 font-medium">
              <strong>Status: Pending</strong> - We&apos;re waiting for confirmation from your
              mobile money provider. This usually takes a few minutes.
            </p>
          </div>
        )}

        {/* Dual-SIM Tip - Atlas redesigned */}
        <div className="bg-atlas-glow border border-atlas-blue/20 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-atlas-blue-dark mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
            <span>Dual-SIM Tip</span>
          </h4>
          <p className="text-sm text-neutral-700 leading-relaxed">
            If you have multiple SIM cards, make sure to use the one registered with your mobile
            money account.
          </p>
        </div>
      </div>
    </div>
  );
}
