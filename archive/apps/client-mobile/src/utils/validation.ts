/**
 * Validate phone number (Rwanda format)
 */
export const validatePhoneNumber = (phone: string): boolean => {
  // Remove non-digits
  const cleaned = phone.replace(/\D/g, "");

  // Check Rwanda formats: 0XXXXXXXXX or 250XXXXXXXXX
  if (cleaned.startsWith("250") && cleaned.length === 12) {
    return /^250(78|79|72|73)\d{7}$/.test(cleaned);
  }

  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return /^0(78|79|72|73)\d{7}$/.test(cleaned);
  }

  return false;
};

/**
 * Validate amount
 */
export const validateAmount = (
  amount: number,
  options: {
    min?: number;
    max?: number;
    allowZero?: boolean;
  } = {}
): { valid: boolean; error?: string } => {
  const { min = 100, max = 10000000, allowZero = false } = options;

  if (!allowZero && amount === 0) {
    return { valid: false, error: "Amount cannot be zero" };
  }

  if (amount < min) {
    return { valid: false, error: `Minimum amount is ${min} RWF` };
  }

  if (amount > max) {
    return { valid: false, error: `Maximum amount is ${max} RWF` };
  }

  return { valid: true };
};

/**
 * Validate OTP code
 */
export const validateOTP = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};

/**
 * Validate email (optional, for future use)
 */
export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate account number
 */
export const validateAccountNumber = (accountNumber: string): boolean => {
  // Account numbers should be 10-16 digits
  const cleaned = accountNumber.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 16;
};

/**
 * Check if string is empty or whitespace
 */
export const isEmpty = (value: string | null | undefined): boolean => {
  return !value || value.trim().length === 0;
};

/**
 * Sanitize amount input (remove non-numeric characters except decimal point)
 */
export const sanitizeAmountInput = (input: string): string => {
  return input.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
};

/**
 * Sanitize phone input (remove non-numeric characters except +)
 */
export const sanitizePhoneInput = (input: string): string => {
  return input.replace(/[^0-9+]/g, "");
};
