/**
 * Format currency amounts
 */
export const formatCurrency = (
  amount: number,
  currency: string = "RWF",
  showSymbol: boolean = true
): string => {
  const formatted = new Intl.NumberFormat("en-RW", {
    style: showSymbol ? "currency" : "decimal",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return formatted;
};

/**
 * Format compact numbers (1K, 1M, etc.)
 */
export const formatCompactNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

/**
 * Format dates relative to now
 */
export const formatRelativeDate = (date: Date | string): string => {
  const now = new Date();
  const target = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - target.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return "Just now";
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  // Format as date
  return new Intl.DateTimeFormat("en-RW", {
    month: "short",
    day: "numeric",
    year: target.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  }).format(target);
};

/**
 * Format full date
 */
export const formatDate = (date: Date | string, format: "short" | "long" = "short"): string => {
  const target = typeof date === "string" ? new Date(date) : date;

  if (format === "long") {
    return new Intl.DateTimeFormat("en-RW", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(target);
  }

  return new Intl.DateTimeFormat("en-RW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(target);
};

/**
 * Format time
 */
export const formatTime = (date: Date | string): string => {
  const target = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat("en-RW", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(target);
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove non-digits
  const cleaned = phone.replace(/\D/g, "");

  // Format as +250 XXX XXX XXX
  if (cleaned.startsWith("250") && cleaned.length === 12) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }

  // Format as 0XXX XXX XXX
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  return phone;
};

/**
 * Format transaction reference
 */
export const formatTransactionRef = (ref: string): string => {
  // Format as XXXX-XXXX-XXXX
  if (ref.length === 12 && /^\d+$/.test(ref)) {
    return `${ref.slice(0, 4)}-${ref.slice(4, 8)}-${ref.slice(8)}`;
  }
  return ref;
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + "...";
};

/**
 * Capitalize first letter
 */
export const capitalize = (text: string): string => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};
