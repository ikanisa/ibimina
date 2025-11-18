/**
 * Member Login Page - WhatsApp OTP Authentication
 *
 * Two-step authentication flow:
 * 1. Enter phone number and request OTP
 * 2. Enter OTP code and verify
 *
 * Features:
 * - WhatsApp OTP authentication
 * - Phone number validation
 * - OTP verification with attempts tracking
 * - Countdown timer for OTP expiry
 * - Resend OTP functionality
 * - WCAG 2.1 AA compliant
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { QrLoginPanel } from "./qr-login-panel";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(3);
  const [canResend, setCanResend] = useState(false);

  // Update countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

      if (diff <= 0) {
        setRemainingTime(0);
        setCanResend(true);
        clearInterval(interval);
      } else {
        setRemainingTime(diff);
        // Allow resend after 1 minute
        if (diff <= 240) {
          setCanResend(true);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  /**
   * Format remaining time as MM:SS
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  /**
   * Validate phone number format
   */
  const validatePhoneNumber = (value: string): string | undefined => {
    const cleaned = value.replace(/\s+/g, "");
    const patterns = [/^07[2-9]\d{7}$/, /^2507[2-9]\d{7}$/, /^\+2507[2-9]\d{7}$/];

    if (!cleaned) {
      return "Phone number is required";
    }

    const isValid = patterns.some((pattern) => pattern.test(cleaned));
    if (!isValid) {
      return "Please enter a valid Rwanda mobile number (e.g., 078XXXXXXX)";
    }

    return undefined;
  };

  /**
   * Send OTP via WhatsApp
   */
  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const validationError = validatePhoneNumber(phoneNumber);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("whatsapp-otp-send", {
        body: { phone_number: phoneNumber },
      });

      if (error) {
        throw new Error(error.message || "Failed to send OTP");
      }

      if (!data.success) {
        throw new Error(data.message || "Failed to send OTP");
      }

      // Move to OTP verification step
      setExpiresAt(new Date(data.expires_at));
      setRemainingTime(300); // 5 minutes
      setCanResend(false);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify OTP code
   */
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpCode || otpCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("whatsapp-otp-verify", {
        body: { phone_number: phoneNumber, code: otpCode },
      });

      if (error) {
        throw new Error(error.message || "Failed to verify OTP");
      }

      if (!data.success) {
        setAttemptsRemaining(data.attempts_remaining ?? 0);
        throw new Error(data.message || "Invalid OTP code");
      }

      // Authentication successful
      // Set session and redirect
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resend OTP
   */
  const handleResendOTP = () => {
    setOtpCode("");
    setAttemptsRemaining(3);
    handleSendOTP();
  };

  /**
   * Go back to phone number entry
   */
  const handleBack = () => {
    setStep("phone");
    setOtpCode("");
    setError(null);
    setExpiresAt(null);
    setRemainingTime(0);
    setCanResend(false);
    setAttemptsRemaining(3);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">
          {step === "phone" ? "Sign In" : "Verify Code"}
        </h1>
        <p className="text-sm text-neutral-700">
          {step === "phone"
            ? "Enter your WhatsApp number to receive a verification code"
            : `We sent a code to ${phoneNumber}`}
        </p>
      </header>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {/* Phone number step */}
      {step === "phone" && (
        <form onSubmit={handleSendOTP} className="space-y-6" noValidate>
          <div>
            <label
              htmlFor="phone-number"
              className="mb-2 block text-sm font-medium text-neutral-700"
            >
              WhatsApp Number{" "}
              <span className="text-red-600" aria-label="required">
                *
              </span>
            </label>
            <input
              id="phone-number"
              name="phoneNumber"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              required
              aria-required="true"
              aria-invalid={!!error}
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setError(null);
              }}
              placeholder="078XXXXXXX"
              disabled={isLoading}
              className={`
                w-full rounded-xl border px-4 py-3
                bg-white
                text-neutral-900 placeholder:text-neutral-400
                transition-all duration-interactive
                focus:border-transparent focus:outline-none focus:ring-2 focus:ring-atlas-blue
                disabled:cursor-not-allowed disabled:opacity-50
                ${error ? "border-red-500 focus:ring-red-500" : "border-neutral-300"}
              `}
            />
            <p className="mt-2 text-xs text-neutral-700">
              You&apos;ll receive a 6-digit verification code via WhatsApp
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full rounded-xl px-6 py-4 text-lg font-semibold
              transition-all duration-interactive
              focus-visible:ring-4 focus-visible:ring-atlas-blue/30
              ${
                isLoading
                  ? "cursor-not-allowed bg-neutral-300 text-neutral-700"
                  : "bg-atlas-blue text-white hover:bg-atlas-blue-dark"
              }
            `}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending Code...
              </span>
            ) : (
              "Send Code"
            )}
          </button>
        </form>
      )}

      {/* OTP verification step */}
      {step === "otp" && (
        <div className="space-y-6">
          {/* Timer and attempts */}
          <div className="flex items-center justify-between text-sm">
            <div className="text-neutral-700">
              {remainingTime > 0 ? (
                <span>Code expires in {formatTime(remainingTime)}</span>
              ) : (
                <span className="text-red-600">Code expired</span>
              )}
            </div>
            <div className="text-neutral-700">
              {attemptsRemaining} attempt{attemptsRemaining !== 1 ? "s" : ""} remaining
            </div>
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-6" noValidate>
            <div>
              <label htmlFor="otp-code" className="mb-2 block text-sm font-medium text-neutral-700">
                Verification Code{" "}
                <span className="text-red-600" aria-label="required">
                  *
                </span>
              </label>
              <input
                id="otp-code"
                name="otpCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                aria-required="true"
                aria-invalid={!!error}
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, ""));
                  setError(null);
                }}
                placeholder="000000"
                disabled={isLoading}
                className={`
                  w-full rounded-xl border px-4 py-3 text-center text-2xl tracking-widest
                  bg-white
                  text-neutral-900 placeholder:text-neutral-400
                  transition-all duration-interactive
                  focus:border-transparent focus:outline-none focus:ring-2 focus:ring-atlas-blue
                  disabled:cursor-not-allowed disabled:opacity-50
                  ${error ? "border-red-500 focus:ring-red-500" : "border-neutral-300"}
                `}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              className={`
                w-full rounded-xl px-6 py-4 text-lg font-semibold
                transition-all duration-interactive
                focus-visible:ring-4 focus-visible:ring-atlas-blue/30
                ${
                  isLoading || otpCode.length !== 6
                    ? "cursor-not-allowed bg-neutral-300 text-neutral-700"
                    : "bg-atlas-blue text-white hover:bg-atlas-blue-dark"
                }
              `}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Verifying...
                </span>
              ) : (
                "Verify Code"
              )}
            </button>
          </form>

          {/* Resend and back buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
              className="flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition-all duration-interactive hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Change Number
            </button>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={isLoading || !canResend}
              className="flex-1 rounded-xl border border-atlas-blue/30 bg-atlas-glow px-4 py-3 text-sm font-medium text-atlas-blue transition-all duration-interactive hover:bg-atlas-blue/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {canResend ? "Resend Code" : "Wait to Resend"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-8">
        <QrLoginPanel />
      </div>

      {/* Help text */}
      <footer className="pt-4 text-center">
        <p className="text-xs text-neutral-700">
          Need help?{" "}
          <a
            href="/help"
            className="rounded text-atlas-blue underline hover:text-atlas-blue-dark focus-visible:ring-2 focus-visible:ring-atlas-blue/30"
          >
            Contact support
          </a>
        </p>
      </footer>
    </div>
  );
}
