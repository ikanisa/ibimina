"use client";

import { useState, useEffect } from "react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import NfcReader, { NfcTagPayload } from "@/lib/plugins/nfc-reader";
import UssdDialer, { SimCard } from "@/lib/plugins/ussd-dialer";

interface TapToPayScreenProps {
  onPaymentComplete?: (result: any) => void;
}

export default function TapToPayScreen({ onPaymentComplete }: TapToPayScreenProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [payload, setPayload] = useState<NfcTagPayload | null>(null);
  const [validationStatus, setValidationStatus] = useState<
    "validating" | "valid" | "expired" | "invalid" | null
  >(null);
  const [simCards, setSimCards] = useState<SimCard[]>([]);
  const [selectedSim, setSelectedSim] = useState<number | null>(null);
  const [showSimPicker, setShowSimPicker] = useState(false);
  const [ussdStatus, setUssdStatus] = useState<
    "idle" | "sending" | "sent" | "failed"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkDualSim();
  }, []);

  useEffect(() => {
    if (isScanning) {
      startNfcScanning();
    }

    return () => {
      if (isScanning) {
        stopNfcScanning();
      }
    };
  }, [isScanning]);

  const checkDualSim = async () => {
    try {
      const { hasDualSim } = await UssdDialer.hasDualSim();
      if (hasDualSim) {
        const { simCards: sims } = await UssdDialer.getSimList();
        setSimCards(sims);
      }
    } catch (err) {
      console.error("Error checking dual SIM:", err);
    }
  };

  const startNfcScanning = async () => {
    try {
      setError(null);
      await NfcReader.startReaderMode();
      await Haptics.impact({ style: ImpactStyle.Light });

      // Listen for tag detection events
      const listener = await NfcReader.addListener(
        "nfcTagDetected",
        handleTagDetected
      );

      // Listen for errors
      await NfcReader.addListener("nfcReadError", (data: any) => {
        setError(data.error || "Failed to read NFC tag");
        Haptics.impact({ style: ImpactStyle.Heavy });
      });

    } catch (err: any) {
      console.error("Error starting NFC scanning:", err);
      setError(err.message || "Failed to start NFC scanning");
      setIsScanning(false);
    }
  };

  const stopNfcScanning = async () => {
    try {
      await NfcReader.stopReaderMode();
      await NfcReader.removeAllListeners();
    } catch (err) {
      console.error("Error stopping NFC scanning:", err);
    }
  };

  const handleTagDetected = async (data: { payload: NfcTagPayload }) => {
    console.log("Tag detected:", data.payload);
    setPayload(data.payload);
    setIsScanning(false);
    await Haptics.impact({ style: ImpactStyle.Medium });

    // Validate payload
    validatePayload(data.payload);
  };

  const validatePayload = (tagPayload: NfcTagPayload) => {
    setValidationStatus("validating");

    const data = tagPayload.payload;
    if (!data) {
      setValidationStatus("invalid");
      setError("Invalid payload format");
      return;
    }

    // Check expiration
    if (data.expires_at && Date.now() > data.expires_at) {
      setValidationStatus("expired");
      setError("Payment request has expired");
      return;
    }

    // Check error flag
    if (data.error === "expired") {
      setValidationStatus("expired");
      setError("This payment request has already expired");
      return;
    }

    // Check signature (in production, verify HMAC on server)
    if (!data.signature) {
      setValidationStatus("invalid");
      setError("Missing signature");
      return;
    }

    // All checks passed
    setValidationStatus("valid");
    setError(null);
  };

  const handleConfirmAndPay = async () => {
    if (!payload?.payload) return;

    // Check if dual SIM and no SIM selected
    if (simCards.length > 1 && selectedSim === null) {
      setShowSimPicker(true);
      return;
    }

    await initiateUssdPayment();
  };

  const initiateUssdPayment = async () => {
    if (!payload?.payload) return;

    const data = payload.payload;
    
    // Build USSD code based on network
    // Example: MTN Rwanda: *182*1*1*[amount]*[merchant]#
    let ussdCode = "";
    
    if (data.network === "MTN") {
      ussdCode = `*182*1*1*${data.amount}*${data.merchant_msisdn}#`;
    } else if (data.network === "Airtel") {
      ussdCode = `*500*${data.merchant_msisdn}*${data.amount}#`;
    } else {
      setError("Unsupported network");
      return;
    }

    try {
      setUssdStatus("sending");
      await Haptics.impact({ style: ImpactStyle.Light });

      const result = await UssdDialer.dialUssd({
        ussdCode,
        subscriptionId: selectedSim ?? undefined,
      });

      if (result.success) {
        setUssdStatus("sent");
        await Haptics.impact({ style: ImpactStyle.Success });
        
        // Mark as pending, wait for SMS confirmation
        setTimeout(() => {
          onPaymentComplete?.({
            status: "pending",
            amount: data.amount,
            ref: data.ref,
            nonce: data.nonce,
          });
        }, 2000);
      } else {
        setUssdStatus("failed");
        setError("Failed to initiate USSD payment");
        await Haptics.impact({ style: ImpactStyle.Heavy });
      }

    } catch (err: any) {
      console.error("Error initiating USSD:", err);
      setUssdStatus("failed");
      setError(err.message || "Failed to dial USSD");
      await Haptics.impact({ style: ImpactStyle.Heavy });
    }
  };

  const formatAmount = (amount: number | undefined, currency: string | undefined) => {
    if (!amount) return "0";
    return `${currency || "RWF"} ${(amount / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (ussdStatus === "sent") {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="text-center">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 mx-auto animate-bounce">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Initiated
          </h2>
          <p className="text-gray-600 mb-6">
            Complete the payment in your dialer, then return to the app.
          </p>
          <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
            <div className="text-sm text-gray-500 mb-1">Amount</div>
            <div className="text-3xl font-bold text-gray-900">
              {formatAmount(payload?.payload?.amount, payload?.payload?.currency)}
            </div>
          </div>
          <button
            onClick={() => {
              setUssdStatus("idle");
              setPayload(null);
              setValidationStatus(null);
            }}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (payload && validationStatus) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Details
          </h2>
          
          {/* Validation Status */}
          <div className={`p-3 rounded-lg mb-4 ${
            validationStatus === "valid" ? "bg-green-100 border-2 border-green-500" :
            validationStatus === "expired" ? "bg-yellow-100 border-2 border-yellow-500" :
            validationStatus === "validating" ? "bg-blue-100 border-2 border-blue-500" :
            "bg-red-100 border-2 border-red-500"
          }`}>
            <div className="flex items-center gap-2">
              {validationStatus === "valid" && <span>✅</span>}
              {validationStatus === "expired" && <span>⏰</span>}
              {validationStatus === "validating" && <span>🔄</span>}
              {validationStatus === "invalid" && <span>❌</span>}
              <span className="font-semibold">
                {validationStatus === "valid" && "Verified"}
                {validationStatus === "expired" && "Expired"}
                {validationStatus === "validating" && "Verifying..."}
                {validationStatus === "invalid" && "Invalid"}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Amount</div>
            <div className="text-4xl font-bold text-gray-900">
              {formatAmount(payload.payload?.amount, payload.payload?.currency)}
            </div>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Network</span>
              <span className="font-semibold">{payload.payload?.network}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Merchant</span>
              <span className="font-semibold">{payload.payload?.merchant_code}</span>
            </div>
            {payload.payload?.ref && (
              <div className="flex justify-between">
                <span className="text-gray-500">Reference</span>
                <span className="font-mono text-xs">{payload.payload.ref}</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* SIM Picker */}
        {showSimPicker && (
          <div className="mb-4 bg-white rounded-lg shadow-lg p-4">
            <h3 className="font-semibold mb-3">Select SIM Card</h3>
            <div className="space-y-2">
              {simCards.map((sim) => (
                <button
                  key={sim.subscriptionId}
                  onClick={() => {
                    setSelectedSim(sim.subscriptionId);
                    setShowSimPicker(false);
                    initiateUssdPayment();
                  }}
                  className="w-full text-left p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 active:scale-[0.98] transition-all"
                >
                  <div className="font-semibold">{sim.displayName}</div>
                  <div className="text-sm text-gray-500">{sim.carrierName}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-auto space-y-3">
          <button
            onClick={handleConfirmAndPay}
            disabled={validationStatus !== "valid" || ussdStatus === "sending"}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {ussdStatus === "sending" ? "Initiating..." : "Confirm & Pay with USSD"}
          </button>

          <button
            onClick={() => {
              setPayload(null);
              setValidationStatus(null);
              setError(null);
            }}
            className="w-full bg-white text-gray-700 font-semibold py-4 px-6 rounded-lg border-2 border-gray-300 hover:border-gray-400 active:scale-[0.98] transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="text-center mb-8">
        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 mx-auto shadow-xl">
          <svg
            className="w-16 h-16 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        
        {isScanning ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Scanning...
            </h2>
            <p className="text-gray-600 mb-4">
              Bring your phone near the merchant's device
            </p>
            <div className="inline-block animate-pulse">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Tap to Pay
            </h2>
            <p className="text-gray-600">
              Hold your phone near the merchant's device to scan
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg max-w-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={() => setIsScanning(!isScanning)}
        className={`px-8 py-4 ${
          isScanning
            ? "bg-red-500 hover:bg-red-600"
            : "bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-xl"
        } text-white font-bold rounded-lg shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all`}
      >
        {isScanning ? "Stop Scanning" : "Start Scanning"}
      </button>
    </div>
  );
}
