/**
 * User-friendly error messages for SACCO+ Client
 * Converts technical errors to plain language
 * WCAG 2.2 AA compliant error handling
 */

export interface AppError {
  code: string;
  message: string;
  action?: string;
  severity: "info" | "warning" | "error" | "success";
}

export const ERROR_MESSAGES: Record<string, AppError> = {
  // Authentication errors
  AUTH_FAILED: {
    code: "AUTH_FAILED",
    message: "We couldn't sign you in. Please check your phone number and try again.",
    action: "Verify your phone number",
    severity: "error",
  },
  SESSION_EXPIRED: {
    code: "SESSION_EXPIRED",
    message: "Your session has expired. Please sign in again.",
    action: "Sign in",
    severity: "warning",
  },

  // Reference/Token errors
  REFERENCE_NOT_FOUND: {
    code: "REFERENCE_NOT_FOUND",
    message: "We couldn't find that payment code. Check your groups and try again.",
    action: "View your groups",
    severity: "error",
  },
  INVALID_REFERENCE: {
    code: "INVALID_REFERENCE",
    message: "This payment code format is incorrect. Please use the code from your group.",
    action: "Get help",
    severity: "error",
  },

  // Group errors
  GROUP_NOT_FOUND: {
    code: "GROUP_NOT_FOUND",
    message: "We couldn't find this savings group. It may have been removed.",
    action: "View all groups",
    severity: "error",
  },
  JOIN_REQUEST_FAILED: {
    code: "JOIN_REQUEST_FAILED",
    message: "We couldn't send your join request. Please try again.",
    action: "Try again",
    severity: "error",
  },

  // Network errors
  NETWORK_ERROR: {
    code: "NETWORK_ERROR",
    message: "Connection problem. Check your internet and try again.",
    action: "Retry",
    severity: "error",
  },
  TIMEOUT: {
    code: "TIMEOUT",
    message: "This is taking longer than usual. Please try again.",
    action: "Retry",
    severity: "warning",
  },

  // Payment errors
  PAYMENT_FAILED: {
    code: "PAYMENT_FAILED",
    message: "Your payment couldn't be processed. Please check with your SACCO.",
    action: "Contact support",
    severity: "error",
  },
  INSUFFICIENT_BALANCE: {
    code: "INSUFFICIENT_BALANCE",
    message: "You don't have enough money in your mobile money account.",
    action: "Add funds",
    severity: "error",
  },

  // Generic fallback
  UNKNOWN_ERROR: {
    code: "UNKNOWN_ERROR",
    message: "Something went wrong. Please try again or contact support.",
    action: "Get help",
    severity: "error",
  },
};

/**
 * Convert technical error to user-friendly message
 */
export function getUserFriendlyError(error: any): AppError {
  if (typeof error === "string") {
    return ERROR_MESSAGES[error] || ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  if (error?.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }

  if (error?.message?.includes("network")) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (error?.message?.includes("timeout")) {
    return ERROR_MESSAGES.TIMEOUT;
  }

  if (error?.message?.includes("reference") || error?.message?.includes("token")) {
    return ERROR_MESSAGES.REFERENCE_NOT_FOUND;
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}
