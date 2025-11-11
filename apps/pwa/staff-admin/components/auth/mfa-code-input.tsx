"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { AlertCircle, CheckCircle2, Clock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMFAVerification } from "@/lib/hooks/use-mfa-verification";

interface MFACodeInputProps {
  length?: number;
  onVerify: (code: string) => Promise<{ success: boolean; error?: string }>;
  onSuccess?: () => void;
  onMaxAttemptsReached?: () => void;
  label?: string;
  description?: string;
  maxAttempts?: number;
  throttleDuration?: number;
}

export function MFACodeInput({
  length = 6,
  onVerify,
  onSuccess,
  onMaxAttemptsReached,
  label = "Enter verification code",
  description = "Enter the 6-digit code from your authenticator app",
  maxAttempts = 5,
  throttleDuration = 30000,
}: MFACodeInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    isVerifying,
    error,
    attempts,
    attemptsRemaining,
    isThrottled,
    remainingTime,
    verify,
    setCode,
  } = useMFAVerification({
    maxAttempts,
    throttleDuration,
    onVerify: async (code) => {
      const result = await onVerify(code);
      if (result.success) {
        onSuccess?.();
      }
      return result;
    },
    onMaxAttemptsReached,
  });

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (isThrottled || isVerifying) return;

    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are filled
    const code = newDigits.join("");
    if (code.length === length) {
      setCode(code);
      setTimeout(() => verify(), 100);
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
      }
    } else if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    const newDigits = pastedData.split("").concat(Array(length).fill("")).slice(0, length);
    setDigits(newDigits);

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[lastIndex]?.focus();

    // Auto-verify if complete
    if (pastedData.length === length) {
      setCode(pastedData);
      setTimeout(() => verify(), 100);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">
          <Shield className="mr-2 inline-block h-4 w-4" aria-hidden="true" />
          {label}
        </label>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
      </div>

      {/* Code Input Grid */}
      <div className="flex gap-2 justify-center" onPaste={handlePaste}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={isVerifying || isThrottled}
            aria-label={`Digit ${index + 1} of ${length}`}
            className={cn(
              "h-14 w-12 text-center text-2xl font-bold rounded-lg border-2 transition-all",
              "focus:outline-none focus:ring-2 focus:ring-atlas-blue focus:border-transparent",
              error
                ? "border-red-500 bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-200"
                : digit
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200"
                  : "border-neutral-300 bg-white text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100",
              isThrottled && "opacity-50 cursor-not-allowed"
            )}
          />
        ))}
      </div>

      {/* Status Messages */}
      <div className="space-y-2">
        {/* Throttle Warning */}
        {isThrottled && (
          <div
            className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200"
            role="alert"
          >
            <Clock className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>
              Too many attempts. Please wait <strong>{remainingTime}s</strong> before trying again.
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && !isThrottled && (
          <div
            className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-900 dark:bg-red-900/20 dark:text-red-200"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Attempts Remaining */}
        {attempts > 0 && attemptsRemaining > 0 && !isThrottled && (
          <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
            <span>
              Attempts remaining: <strong>{attemptsRemaining}</strong> of {maxAttempts}
            </span>
            {attempts >= 3 && (
              <span className="text-amber-600 dark:text-amber-400">
                ⚠️ One more failed attempt will trigger a timeout
              </span>
            )}
          </div>
        )}

        {/* Verification Success */}
        {!error && digits.every((d) => d !== "") && !isVerifying && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>Verifying code...</span>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="text-xs text-neutral-500 dark:text-neutral-400">
        <p>Tip: You can paste your code from your clipboard</p>
      </div>
    </div>
  );
}
