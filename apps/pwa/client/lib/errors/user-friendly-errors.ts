/**
 * User-Friendly Error Messages
 * Implements P0 Fix: H9.1 - Generic error messages
 *
 * Converts technical error messages into plain language with recovery actions.
 * Follows WCAG 2.2 guidelines for error handling.
 */

export interface ErrorMessage {
  title: string;
  message: string;
  action?: string;
  actionLabel?: string;
}

/**
 * Convert technical error messages to user-friendly language
 */
export function getUserFriendlyError(error: unknown): ErrorMessage {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Network errors
  if (
    errorMessage.includes("fetch") ||
    errorMessage.includes("Network") ||
    errorMessage.includes("timeout")
  ) {
    return {
      title: "Connection Problem",
      message: "We couldn't connect to our servers. Check your internet connection and try again.",
      action: "retry",
      actionLabel: "Try Again",
    };
  }

  // Authentication errors
  if (errorMessage.includes("Unauthorized") || errorMessage.includes("401")) {
    return {
      title: "Session Expired",
      message: "Your session has expired. Please log in again to continue.",
      action: "login",
      actionLabel: "Log In",
    };
  }

  if (errorMessage.includes("403") || errorMessage.includes("Forbidden")) {
    return {
      title: "Access Denied",
      message: "You don't have permission to access this. Contact your SACCO if you need help.",
      action: "support",
      actionLabel: "Get Help",
    };
  }

  // Validation errors
  if (errorMessage.includes("Invalid phone") || errorMessage.includes("phone number")) {
    return {
      title: "Invalid Phone Number",
      message: "Please enter a valid Rwandan phone number (starting with 078, 079, 072, or 073).",
      action: "correct",
      actionLabel: "Fix It",
    };
  }

  // Reference token / Payment code errors
  if (errorMessage.includes("reference token") || errorMessage.includes("Unable to verify")) {
    return {
      title: "Payment Code Not Found",
      message: "We couldn't find that payment code. Check your group memberships and try again.",
      action: "viewGroups",
      actionLabel: "View My Groups",
    };
  }

  // Group errors
  if (errorMessage.includes("group") && errorMessage.includes("not found")) {
    return {
      title: "Group Not Found",
      message: "This savings group doesn't exist or you don't have access to it.",
      action: "browseGroups",
      actionLabel: "Browse Groups",
    };
  }

  if (errorMessage.includes("already a member")) {
    return {
      title: "Already a Member",
      message: "You're already a member of this group. Check your groups to see it.",
      action: "viewGroups",
      actionLabel: "View My Groups",
    };
  }

  if (errorMessage.includes("join request pending")) {
    return {
      title: "Request Pending",
      message: "You've already requested to join this group. Please wait for staff approval.",
      action: "viewPending",
      actionLabel: "View Pending Requests",
    };
  }

  // Payment errors
  if (errorMessage.includes("payment") && errorMessage.includes("failed")) {
    return {
      title: "Payment Not Recorded",
      message:
        "We couldn't record your payment. If you completed the USSD payment, contact your SACCO for help.",
      action: "support",
      actionLabel: "Contact Support",
    };
  }

  if (errorMessage.includes("insufficient")) {
    return {
      title: "Insufficient Balance",
      message: "You don't have enough money in your mobile money account for this payment.",
      action: "topup",
      actionLabel: "Add Money",
    };
  }

  // Statement errors
  if (errorMessage.includes("statement") || errorMessage.includes("export")) {
    return {
      title: "Statement Unavailable",
      message: "We couldn't generate your statement right now. Try again in a few minutes.",
      action: "retry",
      actionLabel: "Try Again",
    };
  }

  // Loan errors
  if (errorMessage.includes("loan") && errorMessage.includes("not eligible")) {
    return {
      title: "Not Eligible for Loan",
      message: "You don't meet the requirements for this loan. Contact your SACCO to learn more.",
      action: "support",
      actionLabel: "Contact SACCO",
    };
  }

  // Generic server errors
  if (errorMessage.includes("500") || errorMessage.includes("Internal Server Error")) {
    return {
      title: "Something Went Wrong",
      message: "Our system encountered a problem. We're working on it. Please try again later.",
      action: "retry",
      actionLabel: "Try Again",
    };
  }

  // Rate limiting
  if (errorMessage.includes("429") || errorMessage.includes("Too many")) {
    return {
      title: "Too Many Attempts",
      message: "You've tried too many times. Please wait a few minutes and try again.",
      action: "wait",
      actionLabel: "OK",
    };
  }

  // Default fallback
  return {
    title: "We hit a snag",
    message:
      "Something interrupted the app. Try again in a moment, or reach out to support if it keeps happening.",
    action: "retry",
    actionLabel: "Try Again",
  };
}

/**
 * Get action URL for error recovery
 */
export function getErrorActionUrl(action: string | undefined): string | null {
  switch (action) {
    case "login":
      return "/login";
    case "support":
      return "/support";
    case "viewGroups":
    case "browseGroups":
      return "/groups";
    case "viewPending":
      return "/groups?tab=pending";
    default:
      return null;
  }
}

/**
 * Format error for display
 */
export function formatErrorForDisplay(error: unknown): string {
  const { message } = getUserFriendlyError(error);
  return message;
}
