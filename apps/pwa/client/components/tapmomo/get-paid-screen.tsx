"use client";

import { useState, useEffect } from "react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import NfcReader from "@/lib/plugins/nfc-reader";

interface GetPaidScreenProps {
  merchantName: string;
  merchantCode: string;
  network: "MTN" | "Airtel";
  onPaymentReceived?: (payload: any) => void;
}

export default function GetPaidScreen({
  merchantName,
  merchantCode,
  network,
  onPaymentReceived,
}: GetPaidScreenProps) {
  const [amount, setAmount] = useState("");
  const [ref, setRef] = useState("");
  const [isNfcActive, setIsNfcActive] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [nfcAvailable, setNfcAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkNfcAvailability();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isNfcActive && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            deactivateNfc();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isNfcActive, countdown]);

  const checkNfcAvailability = async () => {
    try {
      const { available } = await NfcReader.isAvailable();
      setNfcAvailable(available);
      if (!available) {
        setError("NFC not available on this device");
      }
    } catch (err) {
      console.error("Error checking NFC availability:", err);
      setNfcAvailable(false);
    }
  };

  const activateNfc = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      await Haptics.impact({ style: ImpactStyle.Medium });
      return;
    }

    try {
      setError(null);
      
      // Generate nonce and timestamp
      const nonce = crypto.randomUUID();
      const timestamp = Date.now();
      const expiresAt = timestamp + 60000; // 60 seconds

      // Build payload (would normally be signed on server)
      const payload = {
        network,
        merchant_code: merchantCode,
        amount: Math.round(parseFloat(amount) * 100), // Convert to minor units
        currency: "RWF",
        ref: ref || `PAY-${Date.now()}`,
        nonce,
        timestamp,
      };

      // TODO: Call server to sign payload with HMAC
      // For now, we'll activate without signature (development only)
      
      setIsNfcActive(true);
      setCountdown(60);
      await Haptics.impact({ style: ImpactStyle.Light });

      // In production, this would arm the HCE service
      console.log("NFC activated with payload:", payload);

    } catch (err) {
      console.error("Error activating NFC:", err);
      setError("Failed to activate NFC");
      await Haptics.impact({ style: ImpactStyle.Heavy });
    }
  };

  const deactivateNfc = async () => {
    setIsNfcActive(false);
    setCountdown(60);
    await Haptics.impact({ style: ImpactStyle.Light });
  };

  const getStatusColor = () => {
    if (!isNfcActive) return "text-gray-400";
    if (countdown > 30) return "text-green-600";
    if (countdown > 10) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Get Paid</h1>
        <p className="text-gray-600">
          {merchantName} • {network}
        </p>
      </div>

      {/* Amount Input */}
      <div className="mb-6">
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Amount (RWF)
        </label>
        <div className="relative">
          <input
            id="amount"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isNfcActive}
            placeholder="0.00"
            className="w-full text-4xl font-bold border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>
      </div>

      {/* Optional Reference */}
      <div className="mb-6">
        <label
          htmlFor="ref"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Reference (Optional)
        </label>
        <input
          id="ref"
          type="text"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          disabled={isNfcActive}
          placeholder="Invoice number"
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
        />
      </div>

      {/* NFC Status */}
      {isNfcActive && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow-lg border-2 border-blue-500 animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-semibold text-gray-900">
              Ready to tap
            </span>
            <span className={`text-2xl font-bold ${getStatusColor()}`}>
              {countdown}s
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Keep your screen on and unlocked. Hold the payer's phone back-to-back
            with yours.
          </p>
          <div className="mt-3 flex gap-2">
            <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
              Time-limited
            </div>
            <div className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
              One-time use
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-auto space-y-3">
        {!isNfcActive ? (
          <>
            <button
              onClick={activateNfc}
              disabled={!nfcAvailable || !amount}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {nfcAvailable ? "Activate NFC Tap" : "NFC Not Available"}
            </button>

            <button
              onClick={() => {/* Show QR code */}}
              disabled={!amount}
              className="w-full bg-white text-gray-700 font-semibold py-4 px-6 rounded-lg border-2 border-gray-300 hover:border-gray-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Show QR Code
            </button>
          </>
        ) : (
          <button
            onClick={deactivateNfc}
            className="w-full bg-red-500 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>Tap expires after {countdown}s or after first use</p>
      </div>
    </div>
  );
}
