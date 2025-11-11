"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Fingerprint, Mail, Loader2 } from "lucide-react";
import { PinAuth } from "@/lib/native/pin-auth";
import { DeviceAuth } from "@/lib/native/device-auth";
import { PinEntry } from "./pin-entry";

export function QuickLogin() {
  const router = useRouter();
  const [hasPin, setHasPin] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPinEntry, setShowPinEntry] = useState(false);

  useEffect(() => {
    checkQuickLoginOptions();
  }, []);

  const checkQuickLoginOptions = async () => {
    try {
      // Check if PIN is set
      const pinStatus = await PinAuth.hasPin();
      setHasPin(pinStatus.hasPin);

      // Check if biometric is available
      const bioStatus = await DeviceAuth.checkBiometricAvailable();
      setHasBiometric(bioStatus.available);
    } catch (err) {
      console.error("Failed to check quick login options:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      setIsLoading(true);

      // Check if device has key
      const keyStatus = await DeviceAuth.hasDeviceKey();
      if (!keyStatus.hasKey) {
        alert("Device not enrolled. Please sign in with email/password first.");
        return;
      }

      // Trigger biometric authentication
      // This would typically sign a challenge for authentication
      // For now, we'll just navigate to dashboard on success

      router.push("/dashboard");
    } catch (err) {
      console.error("Biometric login failed:", err);
      alert("Biometric authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSuccess = () => {
    router.push("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="mt-4 text-sm text-neutral-11">Loading...</p>
      </div>
    );
  }

  if (showPinEntry) {
    return (
      <div className="min-h-screen flex flex-col">
        <PinEntry
          onSuccess={handlePinSuccess}
          onUseBiometric={hasBiometric ? handleBiometricLogin : undefined}
          allowBiometric={hasBiometric}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-8 p-6">
      <div className="flex flex-col items-center space-y-3">
        <div className="rounded-full bg-primary-100 p-4">
          <Lock className="h-12 w-12 text-primary-600" />
        </div>
        <h1 className="text-3xl font-semibold text-neutral-12">Welcome Back</h1>
        <p className="text-sm text-neutral-11 text-center max-w-sm">
          Choose a quick login method to continue
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* PIN Login */}
        {hasPin && (
          <button
            onClick={() => setShowPinEntry(true)}
            disabled={isLoading}
            className="w-full flex items-center gap-4 rounded-2xl bg-primary-500 p-6 text-white hover:bg-primary-600 transition-colors disabled:opacity-50 shadow-lg"
          >
            <div className="rounded-full bg-white/20 p-3">
              <Lock className="h-6 w-6" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold">Sign in with PIN</p>
              <p className="text-sm text-white/80">Enter your 6-digit PIN</p>
            </div>
          </button>
        )}

        {/* Biometric Login */}
        {hasBiometric && (
          <button
            onClick={handleBiometricLogin}
            disabled={isLoading}
            className="w-full flex items-center gap-4 rounded-2xl bg-neutral-3 p-6 hover:bg-neutral-4 transition-colors disabled:opacity-50 border-2 border-neutral-6"
          >
            <div className="rounded-full bg-primary-100 p-3">
              <Fingerprint className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-neutral-12">Sign in with Biometric</p>
              <p className="text-sm text-neutral-11">Use fingerprint or face</p>
            </div>
          </button>
        )}

        {/* Email/Password Fallback */}
        <button
          onClick={() => router.push("/login")}
          disabled={isLoading}
          className="w-full flex items-center gap-4 rounded-2xl bg-neutral-3 p-6 hover:bg-neutral-4 transition-colors disabled:opacity-50 border-2 border-neutral-6"
        >
          <div className="rounded-full bg-neutral-5 p-3">
            <Mail className="h-6 w-6 text-neutral-11" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-neutral-12">Sign in with Email</p>
            <p className="text-sm text-neutral-11">Use email and password</p>
          </div>
        </button>
      </div>

      {/* Info */}
      {!hasPin && !hasBiometric && (
        <div className="rounded-lg bg-neutral-3 border border-neutral-6 p-4 max-w-sm">
          <p className="text-sm text-neutral-11 text-center">
            Quick login is not set up. Sign in with email and password to set up PIN or biometric.
          </p>
        </div>
      )}
    </div>
  );
}
