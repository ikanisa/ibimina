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
  const [isPending, setIsPending] = useState(false);

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
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handlePaidClick = () => {
    setIsPending(true);
    if (onPaidClick) {
      onPaidClick();
    }
  };

  // Format amount with RWF currency
  const formattedAmount = new Intl.NumberFormat("rw-RW", {
    style: "currency",
    currency: "RWF",
    minimumFractionDigits: 0,
  }).format(amount);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Payment Instructions</h2>
        <p className="text-blue-100 text-sm">
          {groupName} • {saccoName}
        </p>
        <p className="text-3xl font-bold mt-4">{formattedAmount}</p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Merchant Code */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Merchant Code
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
              <code className="text-lg font-mono font-semibold text-gray-900">{merchantCode}</code>
            </div>
            <button
              onClick={() => handleCopy(merchantCode, "merchant")}
              className="min-w-[48px] min-h-[48px] flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={copiedMerchant ? "Merchant code copied" : "Copy merchant code"}
            >
              {copiedMerchant ? (
                <Check className="w-5 h-5 text-green-600" aria-hidden="true" />
              ) : (
                <Copy className="w-5 h-5 text-gray-600" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Reference Token */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Reference Code
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
              <code className="text-lg font-mono font-semibold text-blue-900">{reference}</code>
            </div>
            <button
              onClick={() => handleCopy(reference, "reference")}
              className="min-w-[48px] min-h-[48px] flex items-center justify-center px-4 py-3 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={copiedReference ? "Reference code copied" : "Copy reference code"}
            >
              {copiedReference ? (
                <Check className="w-5 h-5 text-green-600" aria-hidden="true" />
              ) : (
                <Copy className="w-5 h-5 text-blue-600" aria-hidden="true" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-600">Use this reference when making your payment</p>
        </div>

        {/* Tap-to-Dial USSD Button */}
        <div className="space-y-3">
          <a
            href={`tel:${encodeURIComponent(ussdCode)}`}
            className="flex items-center justify-center gap-3 w-full min-h-[56px] px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label={`Dial USSD code ${ussdCode} to make payment`}
          >
            <Phone className="w-6 h-6" aria-hidden="true" />
            <span>Dial to Pay: {ussdCode}</span>
          </a>
          <p className="text-xs text-gray-600 text-center">
            Tap the button above to dial the USSD code automatically
          </p>
        </div>

        {/* 3-Step Checklist */}
        <div className="bg-gray-50 rounded-lg p-5 space-y-4">
          <h3 className="text-base font-bold text-gray-900 mb-3">How to Pay (3 Steps)</h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">1</span>
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm font-medium text-gray-900">Dial the USSD code</p>
                <p className="text-xs text-gray-600 mt-1">
                  Tap the green button above or dial manually
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">2</span>
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm font-medium text-gray-900">Enter the reference code</p>
                <p className="text-xs text-gray-600 mt-1">
                  Copy the reference code above and paste it when prompted
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">3</span>
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm font-medium text-gray-900">Confirm the payment</p>
                <p className="text-xs text-gray-600 mt-1">You&apos;ll receive a confirmation SMS</p>
              </div>
            </div>
          </div>
        </div>

        {/* I've Paid Button */}
        <button
          onClick={handlePaidClick}
          disabled={isPending}
          className={`
            w-full min-h-[52px] px-6 py-3 rounded-lg font-semibold text-base
            transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${
              isPending
                ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4" role="status">
            <p className="text-sm text-yellow-800">
              <strong>Status: Pending</strong> - We&apos;re waiting for confirmation from your
              mobile money provider. This usually takes a few minutes.
            </p>
          </div>
        )}

        {/* Dual-SIM Tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
            <span>Dual-SIM Tip</span>
          </h4>
          <p className="text-xs text-blue-800">
            If you have multiple SIM cards, make sure to use the one registered with your mobile
            money account.
          </p>
        </div>
      </div>
    </div>
  );
}
