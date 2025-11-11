"use client";

import { useState, useEffect, useCallback } from "react";

export interface MFAVerificationState {
  code: string;
  isVerifying: boolean;
  error: string | null;
  attempts: number;
  maxAttempts: number;
  isThrottled: boolean;
  throttleEndTime: number | null;
  remainingTime: number;
}

interface UseMFAVerificationOptions {
  maxAttempts?: number;
  throttleDuration?: number; // in milliseconds
  onVerify: (code: string) => Promise<{ success: boolean; error?: string }>;
  onMaxAttemptsReached?: () => void;
}

export function useMFAVerification({
  maxAttempts = 5,
  throttleDuration = 30000, // 30 seconds default
  onVerify,
  onMaxAttemptsReached,
}: UseMFAVerificationOptions) {
  const [state, setState] = useState<MFAVerificationState>({
    code: "",
    isVerifying: false,
    error: null,
    attempts: 0,
    maxAttempts,
    isThrottled: false,
    throttleEndTime: null,
    remainingTime: 0,
  });

  // Countdown timer for throttle
  useEffect(() => {
    if (!state.isThrottled || !state.throttleEndTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((state.throttleEndTime - now) / 1000));

      if (remaining === 0) {
        setState((prev) => ({
          ...prev,
          isThrottled: false,
          throttleEndTime: null,
          remainingTime: 0,
        }));
        clearInterval(interval);
      } else {
        setState((prev) => ({ ...prev, remainingTime: remaining }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isThrottled, state.throttleEndTime]);

  const setCode = useCallback((code: string) => {
    setState((prev) => ({ ...prev, code, error: null }));
  }, []);

  const verify = useCallback(async () => {
    if (state.isThrottled) {
      setState((prev) => ({
        ...prev,
        error: `Too many attempts. Please wait ${prev.remainingTime} seconds.`,
      }));
      return { success: false };
    }

    if (state.attempts >= maxAttempts) {
      setState((prev) => ({
        ...prev,
        error: "Maximum attempts reached. Please try again later or contact support.",
      }));
      onMaxAttemptsReached?.();
      return { success: false };
    }

    setState((prev) => ({ ...prev, isVerifying: true, error: null }));

    try {
      const result = await onVerify(state.code);

      if (result.success) {
        setState((prev) => ({ ...prev, isVerifying: false, error: null }));
        return { success: true };
      } else {
        const newAttempts = state.attempts + 1;
        const shouldThrottle = newAttempts >= 3; // Throttle after 3 failed attempts

        setState((prev) => ({
          ...prev,
          isVerifying: false,
          error: result.error || "Verification failed. Please check your code and try again.",
          attempts: newAttempts,
          isThrottled: shouldThrottle,
          throttleEndTime: shouldThrottle ? Date.now() + throttleDuration : null,
          remainingTime: shouldThrottle ? Math.ceil(throttleDuration / 1000) : 0,
          code: "", // Clear code on failed attempt
        }));

        return { success: false };
      }
    } catch (error) {
      const newAttempts = state.attempts + 1;
      setState((prev) => ({
        ...prev,
        isVerifying: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred.",
        attempts: newAttempts,
        code: "",
      }));
      return { success: false };
    }
  }, [state, maxAttempts, throttleDuration, onVerify, onMaxAttemptsReached]);

  const reset = useCallback(() => {
    setState({
      code: "",
      isVerifying: false,
      error: null,
      attempts: 0,
      maxAttempts,
      isThrottled: false,
      throttleEndTime: null,
      remainingTime: 0,
    });
  }, [maxAttempts]);

  return {
    ...state,
    setCode,
    verify,
    reset,
    attemptsRemaining: Math.max(0, maxAttempts - state.attempts),
  };
}
