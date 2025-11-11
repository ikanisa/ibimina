"use client";

import { useState, useEffect } from "react";
import { Lock, Fingerprint, X, AlertCircle, Loader2 } from "lucide-react";
import { PinAuth } from "@/lib/native/pin-auth";
import { DeviceAuth } from "@/lib/native/device-auth";

interface PinEntryProps {
  onSuccess: () => void;
  onUseBiometric?: () => void;
  allowBiometric?: boolean;
}

export function PinEntry({ onSuccess, onUseBiometric, allowBiometric = true }: PinEntryProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lockStatus, setLockStatus] = useState<any>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkLockStatus();
    checkBiometric();
  }, []);

  const checkLockStatus = async () => {
    try {
      const status = await PinAuth.getLockStatus();
      setLockStatus(status);
      
      if (status.isLocked) {
        setError(`Too many attempts. Try again in ${status.remainingSeconds} seconds`);
      }
    } catch (err) {
      console.error("Failed to check lock status:", err);
    }
  };

  const checkBiometric = async () => {
    try {
      const result = await DeviceAuth.checkBiometricAvailable();
      setBiometricAvailable(result.available);
    } catch (err) {
      console.error("Failed to check biometric:", err);
    }
  };

  const handleDigit = (digit: string) => {
    if (lockStatus?.isLocked) {
      return;
    }

    setError("");
    
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      
      if (newPin.length === 6) {
        // Auto-verify when complete
        setTimeout(() => {
          verifyPin(newPin);
        }, 200);
      }
    }
  };

  const handleBackspace = () => {
    setError("");
    setPin(pin.slice(0, -1));
  };

  const verifyPin = async (enteredPin: string) => {
    if (lockStatus?.isLocked) {
      setError(`Account locked. Try again in ${lockStatus.remainingSeconds} seconds`);
      setPin("");
      return;
    }

    setIsLoading(true);
    try {
      const result = await PinAuth.verifyPin(enteredPin);
      
      if (result.valid) {
        onSuccess();
      } else {
        setError(
          `Incorrect PIN. ${result.attemptsRemaining || 0} attempt${
            result.attemptsRemaining === 1 ? "" : "s"
          } remaining`
        );
        setPin("");
        await checkLockStatus();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to verify PIN";
      setError(errorMessage);
      setPin("");
      await checkLockStatus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  return (
    <div className="flex flex-col items-center space-y-8 p-6">
      <div className="flex flex-col items-center space-y-3">
        <div className="rounded-full bg-primary-100 p-4">
          <Lock className="h-8 w-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-semibold text-neutral-12">Enter Your PIN</h2>
        <p className="text-sm text-neutral-11 text-center max-w-sm">
          Enter your 6-digit PIN to continue
        </p>
      </div>

      {/* PIN Display */}
      <div className="flex gap-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className={`h-14 w-14 rounded-2xl border-2 flex items-center justify-center transition-all ${
              index < pin.length
                ? lockStatus?.isLocked
                  ? "border-red-500 bg-red-50"
                  : "border-primary-500 bg-primary-50"
                : "border-neutral-6 bg-neutral-2"
            }`}
          >
            {index < pin.length && (
              <div
                className={`h-3 w-3 rounded-full ${
                  lockStatus?.isLocked ? "bg-red-500" : "bg-primary-500"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error or Lock Message */}
      {error && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 max-w-sm ${
            lockStatus?.isLocked
              ? "bg-red-50 border-red-200"
              : "bg-orange-50 border-orange-200"
          }`}
        >
          <AlertCircle
            className={`h-5 w-5 flex-shrink-0 ${
              lockStatus?.isLocked ? "text-red-600" : "text-orange-600"
            }`}
          />
          <p
            className={`text-sm ${lockStatus?.isLocked ? "text-red-600" : "text-orange-600"}`}
          >
            {error}
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center gap-2 text-primary-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Verifying...</span>
        </div>
      )}

      {/* Numeric Keypad */}
      <div className="grid grid-cols-3 gap-4 max-w-sm w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigit(digit.toString())}
            disabled={isLoading || lockStatus?.isLocked}
            className="h-16 rounded-2xl bg-neutral-3 hover:bg-neutral-4 active:bg-neutral-5 text-neutral-12 text-2xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {digit}
          </button>
        ))}

        <button
          onClick={handleClear}
          disabled={isLoading || lockStatus?.isLocked || pin.length === 0}
          className="h-16 rounded-2xl bg-neutral-3 hover:bg-neutral-4 active:bg-neutral-5 text-neutral-11 text-sm font-medium transition-colors disabled:opacity-50"
        >
          Clear
        </button>

        <button
          onClick={() => handleDigit("0")}
          disabled={isLoading || lockStatus?.isLocked}
          className="h-16 rounded-2xl bg-neutral-3 hover:bg-neutral-4 active:bg-neutral-5 text-neutral-12 text-2xl font-semibold transition-colors disabled:opacity-50"
        >
          0
        </button>

        <button
          onClick={handleBackspace}
          disabled={isLoading || lockStatus?.isLocked || pin.length === 0}
          className="h-16 rounded-2xl bg-neutral-3 hover:bg-neutral-4 active:bg-neutral-5 text-neutral-11 flex items-center justify-center transition-colors disabled:opacity-50"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Biometric Option */}
      {allowBiometric && biometricAvailable && onUseBiometric && !lockStatus?.isLocked && (
        <div className="w-full max-w-sm space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-6"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-neutral-1 px-4 text-neutral-11">Or</span>
            </div>
          </div>

          <button
            onClick={onUseBiometric}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-500/10 border-2 border-primary-500 px-6 py-3 text-sm font-medium text-primary-600 hover:bg-primary-500/20 transition-colors disabled:opacity-50"
          >
            <Fingerprint className="h-5 w-5" />
            Use Biometric
          </button>
        </div>
      )}

      {/* Attempts Remaining */}
      {lockStatus && !lockStatus.isLocked && lockStatus.failCount > 0 && (
        <div className="text-center space-y-1">
          <p className="text-xs text-neutral-11">
            {lockStatus.attemptsRemaining} attempt{lockStatus.attemptsRemaining === 1 ? "" : "s"}{" "}
            remaining
          </p>
          <p className="text-xs text-neutral-10">
            Account will lock for 15 minutes after {5 - lockStatus.attemptsRemaining} more failed
            attempts
          </p>
        </div>
      )}
    </div>
  );
}
