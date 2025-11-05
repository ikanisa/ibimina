"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export interface ErrorMessageProps {
  /**
   * Error title - should be user-friendly, not technical
   * BAD: "Unable to verify reference token"
   * GOOD: "We couldn't find that payment code"
   */
  title: string;

  /**
   * Error description with helpful context
   * Include what happened and what the user can do
   */
  message: string;

  /**
   * Recovery action - always provide a way forward
   */
  onRetry?: () => void;
  retryLabel?: string;

  /**
   * Secondary action (e.g., "View Help", "Contact Support")
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };

  /**
   * Visual severity
   */
  variant?: "error" | "warning" | "info";
}

/**
 * ErrorMessage component - User-friendly error handling
 *
 * P0 Fix: H9.1 - Generic error messages
 *
 * WCAG 2.2 Compliant:
 * - Uses role="alert" for screen reader announcements
 * - Clear, plain language (no technical jargon)
 * - Always provides recovery path
 * - High contrast colors
 *
 * Usage:
 * ```tsx
 * <ErrorMessage
 *   title="We couldn't find that payment code"
 *   message="Check your groups and try again, or contact your SACCO staff for help."
 *   onRetry={() => fetchData()}
 *   retryLabel="Try Again"
 * />
 * ```
 */
export function ErrorMessage({
  title,
  message,
  onRetry,
  retryLabel = "Try Again",
  secondaryAction,
  variant = "error",
}: ErrorMessageProps) {
  const variants = {
    error: {
      bg: "bg-error-50",
      border: "border-error-200",
      iconColor: "text-error-600",
      textColor: "text-error-900",
    },
    warning: {
      bg: "bg-warning-50",
      border: "border-warning-200",
      iconColor: "text-warning-600",
      textColor: "text-warning-900",
    },
    info: {
      bg: "bg-info-50",
      border: "border-info-200",
      iconColor: "text-info-600",
      textColor: "text-info-900",
    },
  };

  const style = variants[variant];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`${style.bg} ${style.border} border rounded-xl p-6 space-y-4`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          className={`${style.iconColor} flex-shrink-0 mt-0.5`}
          size={24}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <h3 className={`${style.textColor} font-bold text-lg mb-2`}>{title}</h3>
          <p className={`${style.textColor} text-sm leading-relaxed`}>{message}</p>
        </div>
      </div>

      {(onRetry || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {onRetry && (
            <Button
              onClick={onRetry}
              variant={variant === "error" ? "danger" : "primary"}
              size="md"
              leftIcon={<RefreshCw size={16} />}
            >
              {retryLabel}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="outline" size="md">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Common error message templates
 * Use these for consistency across the app
 */
export const ErrorTemplates = {
  NETWORK: {
    title: "Connection problem",
    message: "We couldn't connect to the server. Check your internet connection and try again.",
  },
  NOT_FOUND: {
    title: "We couldn't find that",
    message: "The information you're looking for doesn't exist or has been moved.",
  },
  PAYMENT_CODE: {
    title: "We couldn't find that payment code",
    message: "Check your groups and try again, or contact your SACCO staff for help.",
  },
  PERMISSION: {
    title: "Permission denied",
    message:
      "You don't have permission to access this. Contact your SACCO staff if you think this is a mistake.",
  },
  VALIDATION: {
    title: "Please check your information",
    message: "Some fields need your attention. Review the form and try again.",
  },
  UNKNOWN: {
    title: "Something went wrong",
    message: "We're having trouble right now. Please try again in a few moments.",
  },
  OFFLINE: {
    title: "You're offline",
    message: "Some features need an internet connection. Connect to continue.",
  },
  USSD_DIAL: {
    title: "Couldn't open dialer",
    message:
      "We've copied the USSD code to your clipboard. Paste it in your phone's dialer to complete the payment.",
  },
};
