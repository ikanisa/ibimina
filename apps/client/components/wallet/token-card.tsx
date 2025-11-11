"use client";

import { WalletToken } from "@/lib/types/supa-app";
import { fmtCurrency } from "@/utils/format";
import { Gift, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

interface TokenCardProps {
  token: WalletToken;
  onRedeem?: (token: WalletToken) => void;
}

/**
 * TokenCard Component
 *
 * Displays a wallet token (voucher, loyalty point, etc.) with redemption options.
 * Mobile-first design with large touch targets (≥48px).
 *
 * @param token - Wallet token details
 * @param onRedeem - Callback when user taps "Redeem"
 */
export function TokenCard({ token, onRedeem }: TokenCardProps) {
  const formatAmount = (amount: number | null, currency: string) => {
    if (!amount) return "N/A";
    return fmtCurrency(amount, {
      currency: currency || undefined,
    });
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("rw-RW", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateString));
  };

  const getStatusIcon = () => {
    switch (token.status) {
      case "ACTIVE":
        return <CheckCircle className="w-5 h-5 text-green-600" aria-hidden="true" />;
      case "REDEEMED":
        return <CheckCircle className="w-5 h-5 text-gray-600" aria-hidden="true" />;
      case "EXPIRED":
        return <XCircle className="w-5 h-5 text-red-600" aria-hidden="true" />;
      case "CANCELLED":
        return <XCircle className="w-5 h-5 text-gray-600" aria-hidden="true" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" aria-hidden="true" />;
    }
  };

  const getStatusColor = () => {
    switch (token.status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200";
      case "REDEEMED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "EXPIRED":
        return "bg-red-100 text-red-800 border-red-200";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const canRedeem =
    token.status === "ACTIVE" && (!token.expires_at || new Date(token.expires_at) > new Date());

  return (
    <div
      className={`rounded-lg shadow-md p-6 border ${
        canRedeem ? "bg-white border-blue-200" : "bg-gray-50 border-gray-200"
      }`}
      role="article"
      aria-labelledby={`token-${token.id}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-3 bg-blue-100 rounded-lg">
          <Gift className="w-6 h-6 text-blue-600" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h3 id={`token-${token.id}`} className="text-lg font-semibold text-gray-900 mb-1">
            {token.display_name}
          </h3>
          <div
            className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium ${getStatusColor()}`}
          >
            {getStatusIcon()}
            <span>{token.status}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      {token.description && <p className="text-sm text-gray-700 mb-4">{token.description}</p>}

      {/* Value */}
      {token.value_amount && (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <p className="text-xs text-gray-600 mb-1 font-medium">Token Value</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatAmount(token.value_amount, token.value_currency)}
          </p>
        </div>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div>
          <p className="text-xs text-gray-600 font-medium mb-1">Token Type</p>
          <p className="text-gray-900 font-medium">{token.token_type.replace(/_/g, " ")}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium mb-1">Issued</p>
          <p className="text-gray-900 font-medium">{formatDate(token.issued_at)}</p>
        </div>
        {token.expires_at && (
          <>
            <div className="col-span-2">
              <p className="text-xs text-gray-600 font-medium mb-1">Expires</p>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-600" aria-hidden="true" />
                <p className="text-gray-900 font-medium">{formatDate(token.expires_at)}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Redemption info */}
      {token.status === "REDEEMED" && token.redeemed_at && (
        <div className="mb-4 p-3 bg-gray-100 rounded border border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-1">Redeemed</p>
          <p className="text-sm text-gray-900">{formatDate(token.redeemed_at)}</p>
          {token.redeemed_location && (
            <p className="text-xs text-gray-600 mt-1">at {token.redeemed_location}</p>
          )}
        </div>
      )}

      {/* NFC indicator */}
      {token.nfc_enabled && canRedeem && (
        <div className="mb-4 p-3 bg-purple-50 rounded border border-purple-200">
          <p className="text-sm text-purple-900 font-medium">
            📱 NFC Enabled - Tap your phone to redeem
          </p>
        </div>
      )}

      {/* Redeem button */}
      {canRedeem && (
        <button
          onClick={() => onRedeem?.(token)}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors min-h-[48px]"
          aria-label={`Redeem ${token.display_name}`}
        >
          {token.nfc_enabled ? "Tap to Redeem" : "Redeem Now"}
        </button>
      )}
    </div>
  );
}
