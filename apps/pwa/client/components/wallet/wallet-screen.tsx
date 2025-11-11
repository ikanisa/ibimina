"use client";

import { useState, useEffect } from "react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface WalletBalance {
  balance: number;
  currency: string;
  last_transaction_at: string | null;
}

interface WalletTransaction {
  id: string;
  operation: "mint" | "buy" | "transfer" | "spend" | "burn";
  amount: number;
  currency: string;
  memo: string | null;
  timestamp: string;
  counterparty?: string;
}

export default function WalletScreen() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"balance" | "activity">("balance");
  const [showTransferModal, setShowTransferModal] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setIsLoading(true);
      
      // TODO: Fetch from Supabase
      // const { data: balanceData } = await supabase
      //   .from('wallet_balances')
      //   .select('*')
      //   .single();
      
      // Mock data for now
      setBalance({
        balance: 125000,
        currency: "USDt",
        last_transaction_at: new Date().toISOString(),
      });

      setTransactions([
        {
          id: "1",
          operation: "buy",
          amount: 50000,
          currency: "USDt",
          memo: "Top-up via MoMo",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "2",
          operation: "transfer",
          amount: -25000,
          currency: "USDt",
          memo: "Transfer to John",
          timestamp: new Date(Date.now() - 43200000).toISOString(),
          counterparty: "John Doe",
        },
        {
          id: "3",
          operation: "mint",
          amount: 100000,
          currency: "USDt",
          memo: "Welcome bonus",
          timestamp: new Date(Date.now() - 172800000).toISOString(),
        },
      ]);

    } catch (err) {
      console.error("Error loading wallet data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBalance = (amount: number, currency: string) => {
    return `${currency} ${(amount / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case "mint":
        return "🎁";
      case "buy":
        return "💳";
      case "transfer":
        return "↔️";
      case "spend":
        return "🛒";
      case "burn":
        return "💸";
      default:
        return "📝";
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case "mint":
      case "buy":
        return "text-green-600";
      case "transfer":
        return "text-blue-600";
      case "spend":
      case "burn":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 pb-8">
        <h1 className="text-2xl font-bold mb-6">Wallet</h1>

        {/* Balance Card */}
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
          <div className="text-sm opacity-90 mb-2">Total Balance</div>
          <div className="text-4xl font-bold mb-4">
            {balance ? formatBalance(balance.balance, balance.currency) : "---"}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowTransferModal(true)}
              className="flex-1 bg-white text-purple-600 font-semibold py-3 px-4 rounded-lg hover:bg-gray-100 active:scale-[0.98] transition-all"
            >
              Transfer
            </button>
            <button
              onClick={() => {/* Navigate to buy */}}
              className="flex-1 bg-white/20 backdrop-blur text-white font-semibold py-3 px-4 rounded-lg hover:bg-white/30 active:scale-[0.98] transition-all"
            >
              Buy Tokens
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-200 px-6">
        <button
          onClick={() => {
            setActiveTab("balance");
            Haptics.impact({ style: ImpactStyle.Light });
          }}
          className={`flex-1 py-4 font-semibold border-b-2 transition-colors ${
            activeTab === "balance"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-500"
          }`}
        >
          Balance
        </button>
        <button
          onClick={() => {
            setActiveTab("activity");
            Haptics.impact({ style: ImpactStyle.Light });
          }}
          className={`flex-1 py-4 font-semibold border-b-2 transition-colors ${
            activeTab === "activity"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-500"
          }`}
        >
          Activity
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "balance" && (
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="font-semibold mb-3 text-gray-900">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {/* Navigate to earn */}}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 active:scale-[0.98] transition-all"
                >
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="font-semibold text-sm">Earn</div>
                </button>
                <button
                  onClick={() => {/* Navigate to withdraw */}}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 active:scale-[0.98] transition-all"
                >
                  <div className="text-2xl mb-2">💸</div>
                  <div className="font-semibold text-sm">Withdraw</div>
                </button>
                <button
                  onClick={() => {/* Navigate to vouchers */}}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 active:scale-[0.98] transition-all"
                >
                  <div className="text-2xl mb-2">🎫</div>
                  <div className="font-semibold text-sm">Vouchers</div>
                </button>
                <button
                  onClick={() => {/* Navigate to redeem */}}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 active:scale-[0.98] transition-all"
                >
                  <div className="text-2xl mb-2">🏪</div>
                  <div className="font-semibold text-sm">Redeem</div>
                </button>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="font-semibold mb-3 text-gray-900">Recent</h3>
              <div className="space-y-3">
                {transactions.slice(0, 3).map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getOperationIcon(txn.operation)}</div>
                      <div>
                        <div className="font-semibold text-sm capitalize">
                          {txn.operation}
                        </div>
                        <div className="text-xs text-gray-500">
                          {txn.memo || "No memo"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${getOperationColor(txn.operation)}`}>
                        {txn.amount > 0 ? "+" : ""}
                        {formatBalance(Math.abs(txn.amount), txn.currency)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTimestamp(txn.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveTab("activity")}
                className="w-full mt-3 text-purple-600 font-semibold text-sm py-2"
              >
                View All
              </button>
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-3">
            {transactions.map((txn) => (
              <div
                key={txn.id}
                className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{getOperationIcon(txn.operation)}</div>
                    <div>
                      <div className="font-bold capitalize text-gray-900">
                        {txn.operation}
                      </div>
                      {txn.counterparty && (
                        <div className="text-sm text-gray-600">
                          {txn.counterparty}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`text-xl font-bold ${getOperationColor(txn.operation)}`}>
                    {txn.amount > 0 ? "+" : ""}
                    {formatBalance(Math.abs(txn.amount), txn.currency)}
                  </div>
                </div>
                
                {txn.memo && (
                  <div className="text-sm text-gray-600 mb-2">{txn.memo}</div>
                )}
                
                <div className="text-xs text-gray-500">
                  {new Date(txn.timestamp).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-t-2xl p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Transfer Tokens</h2>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient
                </label>
                <input
                  type="text"
                  placeholder="Phone number or account ID"
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Memo (Optional)
                </label>
                <input
                  type="text"
                  placeholder="What's this for?"
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                />
              </div>
              
              <button
                onClick={() => {
                  // TODO: Submit transfer
                  setShowTransferModal(false);
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-lg shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
              >
                Send Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
