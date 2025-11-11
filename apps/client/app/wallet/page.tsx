"use client";

import { useState, useEffect } from "react";
import { WalletToken } from "@/lib/types/supa-app";
import { TokenCard } from "@/components/wallet/token-card";
import { GradientHeader } from "@ibimina/ui";
import { fmtCurrency } from "@/utils/format";
import { Loader2, AlertCircle, Wallet as WalletIcon } from "lucide-react";
import { trackEvent } from "@/lib/analytics/track";

/**
 * Wallet Page
 *
 * Display user's wallet tokens (vouchers, loyalty points, etc.).
 * Feature-flagged page for non-custodial wallet evidence display.
 */
type WalletFilter = "all" | "active" | "redeemed";

const filterOptions: ReadonlyArray<{ value: WalletFilter; label: string }> = [
  { value: "active", label: "Active" },
  { value: "all", label: "All" },
  { value: "redeemed", label: "Redeemed" },
];

export default function WalletPage() {
  const [tokens, setTokens] = useState<WalletToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<WalletFilter>("active");

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
    trackEvent("wallet_token_tap_attempt", {
      tokenType: token.token_type,
      nfcEnabled: token.nfc_enabled,
      valueAmount: token.value_amount,
      status: token.status,
    });

    // TODO: Implement redemption flow
    // TODO(client-lint): Replace with client-side analytics/logging
    // eslint-disable-next-line ibimina/structured-logging
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
        <Loader2 className="h-12 w-12 animate-spin text-atlas-blue mb-4" />
        <p className="text-neutral-700">Loading wallet...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
        <p className="mb-2 font-semibold text-neutral-900">Error</p>
        <p className="text-center text-neutral-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 pb-20">
      <div className="mx-auto max-w-screen-xl space-y-6 px-4 py-6">
        <GradientHeader
          title="My Wallet"
          subtitle="Manage your vouchers, loyalty points, and digital tokens"
        >
          {/* Total value card */}
          <div className="rounded-2xl bg-white/10 p-6 shadow-atlas backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <WalletIcon className="h-6 w-6" aria-hidden="true" />
              <p className="text-sm font-medium">Total Active Value</p>
            </div>
            <p className="text-4xl font-bold">{fmtCurrency(getTotalValue())}</p>
            <p className="mt-3 text-sm opacity-90">
              {tokens.filter((t) => t.status === "ACTIVE").length} active tokens
            </p>
          </div>
        </GradientHeader>

        {/* Filter tabs */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm">
          <div className="flex gap-2">
            {filterOptions.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`flex-1 rounded-xl px-4 py-2.5 font-medium transition-all duration-interactive ${
                  filter === value
                    ? "bg-atlas-blue text-white shadow-atlas"
                    : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {tokens.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
              <WalletIcon className="h-10 w-10 text-neutral-400" />
            </div>
            <p className="font-medium text-neutral-700">No tokens found</p>
            <p className="mt-2 text-sm text-neutral-700">
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
