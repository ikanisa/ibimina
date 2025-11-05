// Common error messages with user-friendly text
export const ErrorMessages = {
  // Network Errors
  NETWORK_ERROR: "Unable to connect. Please check your internet connection.",
  TIMEOUT: "Request timed out. Please try again.",
  SERVER_ERROR: "Something went wrong on our end. Please try again later.",

  // Authentication Errors
  INVALID_CREDENTIALS: "Invalid phone number or OTP code.",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  UNAUTHORIZED: "You don't have permission to access this.",

  // Validation Errors
  REQUIRED_FIELD: "This field is required.",
  INVALID_PHONE: "Please enter a valid phone number.",
  INVALID_AMOUNT: "Please enter a valid amount.",
  INSUFFICIENT_BALANCE: "Insufficient balance for this transaction.",
  AMOUNT_TOO_LOW: "Amount must be at least {min}.",
  AMOUNT_TOO_HIGH: "Amount cannot exceed {max}.",

  // Transaction Errors
  TRANSACTION_FAILED: "Transaction failed. Please try again.",
  PAYMENT_DECLINED: "Payment was declined. Please try another method.",
  DUPLICATE_TRANSACTION: "This transaction was already processed.",

  // Account Errors
  ACCOUNT_NOT_FOUND: "Account not found.",
  ACCOUNT_SUSPENDED: "Your account has been suspended. Contact support.",
  ACCOUNT_LOCKED: "Account temporarily locked. Try again later.",

  // Generic Errors
  UNKNOWN_ERROR: "An unexpected error occurred.",
  TRY_AGAIN: "Something went wrong. Please try again.",
};

// Map backend error codes to user-friendly messages
export const mapErrorMessage = (error: any): string => {
  if (!error) return ErrorMessages.UNKNOWN_ERROR;

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  // Handle error objects
  const errorCode = error.code || error.status;
  const errorMessage = error.message || error.error;

  // Network errors
  if (error.isAxiosError) {
    if (!error.response) {
      return ErrorMessages.NETWORK_ERROR;
    }

    const status = error.response.status;

    switch (status) {
      case 401:
        return ErrorMessages.UNAUTHORIZED;
      case 403:
        return ErrorMessages.UNAUTHORIZED;
      case 404:
        return ErrorMessages.ACCOUNT_NOT_FOUND;
      case 408:
        return ErrorMessages.TIMEOUT;
      case 429:
        return "Too many requests. Please slow down.";
      case 500:
      case 502:
      case 503:
      case 504:
        return ErrorMessages.SERVER_ERROR;
      default:
        return errorMessage || ErrorMessages.UNKNOWN_ERROR;
    }
  }

  // Supabase errors
  if (error.code === "PGRST116") {
    return ErrorMessages.ACCOUNT_NOT_FOUND;
  }

  if (error.code === "23505") {
    return ErrorMessages.DUPLICATE_TRANSACTION;
  }

  if (error.code === "OTP_EXPIRED") {
    return "OTP code has expired. Please request a new one.";
  }

  if (error.code === "INVALID_OTP") {
    return "Invalid OTP code. Please check and try again.";
  }

  // Return message if available
  if (errorMessage) {
    // Make technical errors user-friendly
    if (errorMessage.includes("JWT")) {
      return ErrorMessages.SESSION_EXPIRED;
    }
    if (errorMessage.includes("network")) {
      return ErrorMessages.NETWORK_ERROR;
    }
    return errorMessage;
  }

  return ErrorMessages.UNKNOWN_ERROR;
};

// Format error for display
export const formatError = (error: any, fallback?: string): string => {
  const message = mapErrorMessage(error);
  return message || fallback || ErrorMessages.UNKNOWN_ERROR;
};

// Check if error is retryable
export const isRetryableError = (error: any): boolean => {
  if (!error) return false;

  if (error.isAxiosError) {
    const status = error.response?.status;
    // Retry on network errors and server errors
    return !error.response || status >= 500;
  }

  // Retry on network errors
  if (error.code === "NETWORK_ERROR" || error.message?.includes("network")) {
    return true;
  }

  return false;
};
