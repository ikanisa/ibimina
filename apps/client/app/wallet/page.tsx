"use client";

import { useState, useEffect } from "react";
import { WalletToken } from "@/lib/types/supa-app";
import { TokenCard } from "@/components/wallet/token-card";
import { Loader2, AlertCircle, Wallet as WalletIcon } from "lucide-react";

/**
 * Wallet Page
 *
 * Display user's wallet tokens (vouchers, loyalty points, etc.).
 * Feature-flagged page for non-custodial wallet evidence display.
 */
export default function WalletPage() {
  const [tokens, setTokens] = useState<WalletToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "redeemed">("active");

  useEffect(() => {
    async function fetchTokens() {
      try {
        const url =
          filter === "all"
            ? "/api/wallet/tokens"
            : `/api/wallet/tokens?status=${filter.toUpperCase()}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch wallet tokens");
        }
        const data = await response.json();
        setTokens(data.tokens || []);
      } catch (err) {
        console.error("Error fetching wallet tokens:", err);
        setError("Unable to load wallet tokens. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchTokens();
  }, [filter]);

  const handleRedeem = (token: WalletToken) => {
    // TODO: Implement redemption flow
    console.log("Redeem token:", token.id);
    alert(`Redeem ${token.display_name} - Redemption flow coming soon!`);
  };

  const getTotalValue = () => {
    return tokens
      .filter((t) => t.status === "ACTIVE" && t.value_amount)
      .reduce((sum, t) => sum + (t.value_amount || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading wallet...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
        <p className="text-gray-900 font-semibold mb-2">Error</p>
        <p className="text-gray-600 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <WalletIcon className="w-8 h-8" aria-hidden="true" />
            <h1 className="text-2xl font-bold">My Wallet</h1>
          </div>

          {/* Total value card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm text-blue-100 mb-1">Total Active Value</p>
            <p className="text-3xl font-bold">
              {new Intl.NumberFormat("rw-RW", {
                style: "currency",
                currency: "RWF",
                minimumFractionDigits: 0,
              }).format(getTotalValue())}
            </p>
            <p className="text-xs text-blue-100 mt-2">
              {tokens.filter((t) => t.status === "ACTIVE").length} active tokens
            </p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[140px] z-10">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex gap-4 overflow-x-auto">
            {[
              { value: "active", label: "Active" },
              { value: "all", label: "All" },
              { value: "redeemed", label: "Redeemed" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value as any)}
                className={`py-3 px-4 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  filter === value
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {tokens.length === 0 ? (
          <div className="text-center py-12">
            <WalletIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No tokens found</p>
            <p className="text-sm text-gray-500 mt-2">
              {filter === "active" ? "You don't have any active tokens." : "Your wallet is empty."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tokens.map((token) => (
              <TokenCard key={token.id} token={token} onRedeem={handleRedeem} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
