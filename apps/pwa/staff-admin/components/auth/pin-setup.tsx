"use client";

import { useState } from "react";
import { Lock, Check, X, AlertCircle } from "lucide-react";
import { PinAuth } from "@/lib/native/pin-auth";
import { useRouter } from "next/navigation";

interface PinSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export function PinSetup({ onComplete, onSkip }: PinSetupProps) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDigit = (digit: string) => {
    setError("");

    if (step === "enter") {
      if (pin.length < 6) {
        const newPin = pin + digit;
        setPin(newPin);

        if (newPin.length === 6) {
          // Auto-advance to confirm step
          setTimeout(() => {
            setStep("confirm");
          }, 200);
        }
      }
    } else {
      if (confirmPin.length < 6) {
        const newConfirm = confirmPin + digit;
        setConfirmPin(newConfirm);

        if (newConfirm.length === 6) {
          // Auto-verify when complete
          setTimeout(() => {
            verifyAndSetPin(pin, newConfirm);
          }, 200);
        }
      }
    }
  };

  const handleBackspace = () => {
    setError("");
    if (step === "enter") {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const verifyAndSetPin = async (enteredPin: string, confirmedPin: string) => {
    if (enteredPin !== confirmedPin) {
      setError("PINs do not match. Please try again.");
      setPin("");
      setConfirmPin("");
      setStep("enter");
      return;
    }

    setIsLoading(true);
    try {
      await PinAuth.setPin(enteredPin);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set PIN");
      setPin("");
      setConfirmPin("");
      setStep("enter");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPin("");
    setConfirmPin("");
    setStep("enter");
    setError("");
  };

  const currentValue = step === "enter" ? pin : confirmPin;

  return (
    <div className="flex flex-col items-center space-y-8 p-6">
      <div className="flex flex-col items-center space-y-3">
        <div className="rounded-full bg-primary-100 p-4">
          <Lock className="h-8 w-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-semibold text-neutral-12">
          {step === "enter" ? "Set Your PIN" : "Confirm Your PIN"}
        </h2>
        <p className="text-sm text-neutral-11 text-center max-w-sm">
          {step === "enter"
            ? "Choose a 6-digit PIN for quick and secure login"
            : "Re-enter your PIN to confirm"}
        </p>
      </div>

      {/* PIN Display */}
      <div className="flex gap-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className={`h-14 w-14 rounded-2xl border-2 flex items-center justify-center transition-all ${
              index < currentValue.length
                ? "border-primary-500 bg-primary-50"
                : "border-neutral-6 bg-neutral-2"
            }`}
          >
            {index < currentValue.length && <div className="h-3 w-3 rounded-full bg-primary-500" />}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 max-w-sm">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Numeric Keypad */}
      <div className="grid grid-cols-3 gap-4 max-w-sm w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigit(digit.toString())}
            disabled={isLoading}
            className="h-16 rounded-2xl bg-neutral-3 hover:bg-neutral-4 active:bg-neutral-5 text-neutral-12 text-2xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {digit}
          </button>
        ))}

        <button
          onClick={handleReset}
          disabled={isLoading}
          className="h-16 rounded-2xl bg-neutral-3 hover:bg-neutral-4 active:bg-neutral-5 text-neutral-11 text-sm font-medium transition-colors disabled:opacity-50"
        >
          Reset
        </button>

        <button
          onClick={() => handleDigit("0")}
          disabled={isLoading}
          className="h-16 rounded-2xl bg-neutral-3 hover:bg-neutral-4 active:bg-neutral-5 text-neutral-12 text-2xl font-semibold transition-colors disabled:opacity-50"
        >
          0
        </button>

        <button
          onClick={handleBackspace}
          disabled={isLoading}
          className="h-16 rounded-2xl bg-neutral-3 hover:bg-neutral-4 active:bg-neutral-5 text-neutral-11 flex items-center justify-center transition-colors disabled:opacity-50"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Skip Option */}
      {onSkip && step === "enter" && (
        <button
          onClick={onSkip}
          disabled={isLoading}
          className="text-sm text-neutral-11 hover:text-neutral-12 underline transition-colors disabled:opacity-50"
        >
          Skip for now
        </button>
      )}

      {/* Security Info */}
      <div className="rounded-lg bg-neutral-3 p-4 space-y-2 max-w-sm w-full">
        <div className="flex items-start gap-3">
          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-neutral-12">Secure PIN Storage</p>
            <ul className="space-y-1 text-neutral-11 text-xs">
              <li>• Encrypted with Android Keystore</li>
              <li>• Hashed with PBKDF2-SHA256</li>
              <li>• Never stored in plain text</li>
              <li>• Device-specific (doesn't sync)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
