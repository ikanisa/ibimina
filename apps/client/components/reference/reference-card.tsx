/**
 * Reference Card Component
 *
 * Displays a member's reference token with QR code and copy functionality.
 * Used for easy sharing and payment reference.
 *
 * Features:
 * - Large, prominent reference token display
 * - QR code generation (placeholder - needs QR library)
 * - Copy to clipboard with haptic feedback
 * - High contrast, accessible design
 */

"use client";

import { useState } from "react";
import { Copy, Check, QrCode } from "lucide-react";

interface ReferenceCardProps {
  reference: string;
  memberName: string;
  groupName?: string;
  showQR?: boolean;
}

export function ReferenceCard({
  reference,
  memberName,
  groupName,
  showQR = true,
}: ReferenceCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Haptic feedback if available
      if ("vibrate" in navigator) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error("Failed to copy reference:", error);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="p-6 text-white">
        <h2 className="text-lg font-bold mb-1">Your Reference Code</h2>
        <p className="text-blue-100 text-sm">{memberName}</p>
        {groupName && <p className="text-blue-200 text-xs mt-1">{groupName}</p>}
      </div>

      <div className="bg-white p-6 space-y-6">
        {/* QR Code Placeholder */}
        {showQR && (
          <div className="flex justify-center">
            <div className="w-48 h-48 bg-gray-100 border-4 border-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-2" aria-hidden="true" />
                <p className="text-xs text-gray-500">QR Code</p>
                <p className="text-xs text-gray-400 mt-1">Coming Soon</p>
              </div>
            </div>
          </div>
        )}

        {/* Reference Token */}
        <div className="space-y-2">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <code className="text-2xl font-mono font-bold text-blue-900 text-center block">
              {reference}
            </code>
          </div>

          <button
            onClick={handleCopy}
            className="w-full min-h-[52px] flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={copied ? "Reference copied" : "Copy reference to clipboard"}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" aria-hidden="true" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" aria-hidden="true" />
                <span>Copy Reference</span>
              </>
            )}
          </button>
        </div>

        {/* Usage Note */}
        <div className="text-center text-xs text-gray-600">
          <p>Use this reference code when making payments</p>
          <p className="mt-1">Share this card to receive payments</p>
        </div>
      </div>
    </div>
  );
}
