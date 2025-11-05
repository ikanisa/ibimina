/**
 * Friendly Error Messages
 *
 * P0 Fix: H9.1 - Generic error messages
 * Replaces technical error messages with user-friendly text and recovery actions
 *
 * Design Principles:
 * - Plain language (no jargon)
 * - Explain what happened
 * - Suggest what to do next
 * - Provide recovery actions
 * - Avoid blaming the user
 */

export interface FriendlyError {
  title: string;
  message: string;
  action: string;
  actionLabel: string;
  secondaryAction?: string;
  secondaryLabel?: string;
}

/**
 * Map of technical error codes/messages to friendly equivalents
 */
export const ERROR_MESSAGES: Record<string, FriendlyError> = {
  // Authentication Errors
  UNAUTHENTICATED: {
    title: "Please sign in",
    message: "Your session has expired. Sign in again to continue managing your savings.",
    action: "/auth/login",
    actionLabel: "Sign In",
  },
  UNAUTHORIZED: {
    title: "Access not allowed",
    message: "You don't have permission to view this page. Please check with your SACCO staff.",
    action: "/home",
    actionLabel: "Go to Home",
  },

  // Network Errors
  NETWORK_ERROR: {
    title: "Connection problem",
    message: "We couldn't connect to the server. Check your internet connection and try again.",
    action: "retry",
    actionLabel: "Try Again",
  },
  TIMEOUT: {
    title: "Request timed out",
    message: "This is taking longer than expected. Please check your connection and try again.",
    action: "retry",
    actionLabel: "Try Again",
  },
  OFFLINE: {
    title: "You're offline",
    message:
      "No internet connection detected. You can view saved information, but can't make changes until you're back online.",
    action: "retry",
    actionLabel: "Retry Connection",
    secondaryAction: "/statements",
    secondaryLabel: "View Saved Statements",
  },

  // Data Errors
  NOT_FOUND: {
    title: "Not found",
    message:
      "We couldn't find what you're looking for. It may have been removed or you don't have access.",
    action: "/home",
    actionLabel: "Go to Home",
  },
  INVALID_REFERENCE: {
    title: "Payment code not recognized",
    message:
      "We couldn't find that payment code. Check your groups and try again, or contact your SACCO staff.",
    action: "/groups",
    actionLabel: "View Your Groups",
    secondaryAction: "/support",
    secondaryLabel: "Get Help",
  },
  GROUP_NOT_FOUND: {
    title: "Group not found",
    message:
      "This savings group doesn't exist or you don't have access to it. Check with your SACCO staff.",
    action: "/groups",
    actionLabel: "View Your Groups",
  },
  MEMBER_NOT_FOUND: {
    title: "Member not found",
    message: "We couldn't find your member information. Please contact your SACCO staff.",
    action: "/support",
    actionLabel: "Contact Support",
  },

  // Payment Errors
  PAYMENT_FAILED: {
    title: "Payment couldn't be processed",
    message:
      "There was a problem processing your payment. Please try again or contact your mobile money provider.",
    action: "retry",
    actionLabel: "Try Again",
    secondaryAction: "/support",
    secondaryLabel: "Get Help",
  },
  INSUFFICIENT_FUNDS: {
    title: "Insufficient balance",
    message: "You don't have enough money in your mobile money account. Add funds and try again.",
    action: "close",
    actionLabel: "OK",
  },
  INVALID_AMOUNT: {
    title: "Invalid amount",
    message:
      "The amount you entered isn't valid. Please enter a number between 100 and 1,000,000 Rwandan Francs.",
    action: "retry",
    actionLabel: "Try Again",
  },
  USSD_DIAL_FAILED: {
    title: "Couldn't open dialer",
    message:
      "We couldn't automatically open your phone's dialer. The USSD code has been copied to your clipboard. Paste it into your dialer to continue.",
    action: "copy",
    actionLabel: "Copy Code Again",
    secondaryAction: "close",
    secondaryLabel: "I'll Do It Manually",
  },

  // Group Errors
  JOIN_REQUEST_FAILED: {
    title: "Couldn't submit request",
    message:
      "We couldn't submit your request to join this group. Please try again or contact your SACCO staff.",
    action: "retry",
    actionLabel: "Try Again",
    secondaryAction: "/support",
    secondaryLabel: "Get Help",
  },
  ALREADY_MEMBER: {
    title: "Already a member",
    message: "You're already a member of this group.",
    action: "close",
    actionLabel: "OK",
  },
  PENDING_REQUEST: {
    title: "Request pending",
    message:
      "Your request to join this group is being reviewed by SACCO staff. We'll notify you when it's approved.",
    action: "close",
    actionLabel: "OK",
  },

  // Server Errors
  INTERNAL_ERROR: {
    title: "Something went wrong",
    message:
      "We encountered an unexpected problem. Our team has been notified. Please try again in a few moments.",
    action: "retry",
    actionLabel: "Try Again",
    secondaryAction: "/support",
    secondaryLabel: "Report Problem",
  },
  SERVICE_UNAVAILABLE: {
    title: "Service temporarily unavailable",
    message: "The service is temporarily down for maintenance. Please try again in a few minutes.",
    action: "retry",
    actionLabel: "Try Again",
  },
  RATE_LIMIT: {
    title: "Too many requests",
    message: "You're doing that too quickly. Please wait a moment and try again.",
    action: "close",
    actionLabel: "OK",
  },

  // Validation Errors
  VALIDATION_ERROR: {
    title: "Please check your information",
    message: "Some information is missing or incorrect. Please review and try again.",
    action: "close",
    actionLabel: "OK",
  },
  INVALID_PHONE: {
    title: "Invalid phone number",
    message: "Please enter a valid Rwandan phone number (e.g., 078 123 4567 or +250 78 123 4567).",
    action: "close",
    actionLabel: "OK",
  },
  REQUIRED_FIELD: {
    title: "Required information missing",
    message: "Please fill in all required fields before continuing.",
    action: "close",
    actionLabel: "OK",
  },

  // Permission Errors
  CAMERA_PERMISSION: {
    title: "Camera access needed",
    message:
      "To scan receipts, we need access to your camera. Please enable camera permissions in your device settings.",
    action: "settings",
    actionLabel: "Open Settings",
    secondaryAction: "close",
    secondaryLabel: "Not Now",
  },
  LOCATION_PERMISSION: {
    title: "Location access needed",
    message:
      "To find nearby branches, we need access to your location. Enable location permissions in your device settings.",
    action: "settings",
    actionLabel: "Open Settings",
    secondaryAction: "close",
    secondaryLabel: "Not Now",
  },

  // Default fallback
  UNKNOWN_ERROR: {
    title: "Unexpected error",
    message:
      "Something unexpected happened. Please try again, and if the problem continues, contact support.",
    action: "retry",
    actionLabel: "Try Again",
    secondaryAction: "/support",
    secondaryLabel: "Contact Support",
  },
};

/**
 * Get friendly error message for a technical error code
 * @param errorCode - Technical error code or message
 * @returns Friendly error object with title, message, and recovery actions
 */
export function getFriendlyError(errorCode: string): FriendlyError {
  // Normalize error code
  const normalizedCode = errorCode.toUpperCase().replace(/\s+/g, "_");

  // Check for exact match
  if (ERROR_MESSAGES[normalizedCode]) {
    return ERROR_MESSAGES[normalizedCode];
  }

  // Check for partial matches
  if (normalizedCode.includes("AUTH")) {
    return ERROR_MESSAGES.UNAUTHENTICATED;
  }
  if (normalizedCode.includes("NETWORK") || normalizedCode.includes("FETCH")) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  if (normalizedCode.includes("NOT_FOUND") || normalizedCode.includes("404")) {
    return ERROR_MESSAGES.NOT_FOUND;
  }
  if (normalizedCode.includes("PERMISSION") || normalizedCode.includes("UNAUTHORIZED")) {
    return ERROR_MESSAGES.UNAUTHORIZED;
  }
  if (normalizedCode.includes("TIMEOUT")) {
    return ERROR_MESSAGES.TIMEOUT;
  }
  if (normalizedCode.includes("SERVER") || normalizedCode.includes("500")) {
    return ERROR_MESSAGES.INTERNAL_ERROR;
  }
  if (normalizedCode.includes("VALIDATION")) {
    return ERROR_MESSAGES.VALIDATION_ERROR;
  }

  // Return generic fallback
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Format technical error into friendly message
 * Handles various error formats (Error objects, strings, etc.)
 */
export function formatError(error: unknown): FriendlyError {
  // Handle Error objects
  if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    // Check error message for known patterns
    return getFriendlyError(error.message);
  }

  // Handle string errors
  if (typeof error === "string") {
    return getFriendlyError(error);
  }

  // Handle objects with error code
  if (typeof error === "object" && error !== null) {
    const errorObj = error as Record<string, unknown>;
    if (typeof errorObj.code === "string") {
      return getFriendlyError(errorObj.code);
    }
    if (typeof errorObj.message === "string") {
      return getFriendlyError(errorObj.message);
    }
  }

  // Fallback for unknown error types
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Extract user-friendly message from API response
 * Handles various API error response formats
 */
export function extractApiError(response: unknown): FriendlyError {
  if (typeof response === "object" && response !== null) {
    const resp = response as Record<string, unknown>;

    // Check for explicit error code
    if (typeof resp.code === "string") {
      return getFriendlyError(resp.code);
    }

    // Check for error message
    if (typeof resp.error === "string") {
      return getFriendlyError(resp.error);
    }

    // Check for message field
    if (typeof resp.message === "string") {
      return getFriendlyError(resp.message);
    }

    // Check for details
    if (typeof resp.details === "string") {
      return getFriendlyError(resp.details);
    }
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}
