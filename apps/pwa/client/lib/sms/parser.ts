/**
 * SMS Parser for Mobile Money transactions
 *
 * Parses SMS messages from MTN and Airtel Mobile Money to extract
 * transaction details for automatic payment confirmation.
 */

export interface ParsedSMS {
  provider: "MTN" | "Airtel" | "Unknown";
  type: "payment" | "received" | "transfer" | "unknown";
  amount: number;
  currency: string;
  referenceToken?: string;
  transactionId?: string;
  timestamp: Date;
  rawText: string;
}

/**
 * MTN MoMo SMS patterns
 *
 * Example: "You have sent RWF 5,000 to 0788123456. Ref: MTN12345. Balance: RWF 45,000"
 * Example: "Transaction successful. You paid RWF 10000 to MERCHANT. Ref: ABC123"
 */
const MTN_PATTERNS = {
  // Payment sent pattern
  sent: /you have sent\s+(?:rwf|frw)\s*([\d,]+)\s*to\s*(\d+).*?ref:?\s*([A-Za-z0-9]+)/i,

  // Payment received pattern
  received: /you have received\s+(?:rwf|frw)\s*([\d,]+)\s*from\s*(\d+).*?ref:?\s*([A-Za-z0-9]+)/i,

  // Merchant payment pattern
  payment:
    /transaction successful.*?paid\s+(?:rwf|frw)\s*([\d,]+)\s*to\s*([A-Za-z0-9\s]+).*?ref:?\s*([A-Za-z0-9]+)/i,

  // Alternative payment pattern
  paymentAlt: /you paid\s+(?:rwf|frw)\s*([\d,]+).*?ref:?\s*([A-Za-z0-9]+)/i,
};

/**
 * Airtel Money SMS patterns
 *
 * Example: "Transaction successful. Paid RWF 5000 to MERCHANT. Ref: AM123456"
 */
const AIRTEL_PATTERNS = {
  // Payment sent pattern
  sent: /paid\s+(?:rwf|frw)\s*([\d,]+)\s*to\s*([A-Za-z0-9\s]+).*?ref:?\s*([A-Za-z0-9]+)/i,

  // Payment received pattern
  received: /received\s+(?:rwf|frw)\s*([\d,]+)\s*from\s*([A-Za-z0-9\s]+).*?ref:?\s*([A-Za-z0-9]+)/i,

  // Transaction pattern
  transaction:
    /transaction\s+(?:successful|confirmed).*?(?:rwf|frw)\s*([\d,]+).*?ref:?\s*([A-Za-z0-9]+)/i,
};

/**
 * Parse an SMS message to extract transaction details
 */
export function parseSMS(text: string, source?: string): ParsedSMS | null {
  if (!text || text.trim().length === 0) {
    return null;
  }

  const normalizedText = text.trim();

  // Detect provider
  const provider = detectProvider(normalizedText, source);

  // Try to parse based on provider
  let parsed: ParsedSMS | null = null;

  if (provider === "MTN") {
    parsed = parseMTN(normalizedText);
  } else if (provider === "Airtel") {
    parsed = parseAirtel(normalizedText);
  }

  if (parsed) {
    parsed.provider = provider;
    parsed.rawText = text;
    parsed.timestamp = new Date();
  }

  return parsed;
}

/**
 * Detect the mobile money provider from SMS text or source
 */
function detectProvider(text: string, source?: string): "MTN" | "Airtel" | "Unknown" {
  // Check source package
  if (source) {
    if (source.includes("mtn")) return "MTN";
    if (source.includes("airtel")) return "Airtel";
  }

  // Check SMS content
  const lowerText = text.toLowerCase();
  if (lowerText.includes("mtn") || lowerText.includes("momo")) {
    return "MTN";
  }
  if (lowerText.includes("airtel")) {
    return "Airtel";
  }

  return "Unknown";
}

/**
 * Parse MTN MoMo SMS
 */
function parseMTN(text: string): ParsedSMS | null {
  // Try sent pattern
  let match = text.match(MTN_PATTERNS.sent);
  if (match) {
    return {
      provider: "MTN",
      type: "payment",
      amount: parseAmount(match[1]),
      currency: "RWF",
      referenceToken: match[3],
      transactionId: match[3],
      timestamp: new Date(),
      rawText: text,
    };
  }

  // Try received pattern
  match = text.match(MTN_PATTERNS.received);
  if (match) {
    return {
      provider: "MTN",
      type: "received",
      amount: parseAmount(match[1]),
      currency: "RWF",
      referenceToken: match[3],
      transactionId: match[3],
      timestamp: new Date(),
      rawText: text,
    };
  }

  // Try payment pattern
  match = text.match(MTN_PATTERNS.payment);
  if (match) {
    return {
      provider: "MTN",
      type: "payment",
      amount: parseAmount(match[1]),
      currency: "RWF",
      referenceToken: match[3],
      transactionId: match[3],
      timestamp: new Date(),
      rawText: text,
    };
  }

  // Try alternative payment pattern
  match = text.match(MTN_PATTERNS.paymentAlt);
  if (match) {
    return {
      provider: "MTN",
      type: "payment",
      amount: parseAmount(match[1]),
      currency: "RWF",
      referenceToken: match[2],
      transactionId: match[2],
      timestamp: new Date(),
      rawText: text,
    };
  }

  return null;
}

/**
 * Parse Airtel Money SMS
 */
function parseAirtel(text: string): ParsedSMS | null {
  // Try sent pattern
  let match = text.match(AIRTEL_PATTERNS.sent);
  if (match) {
    return {
      provider: "Airtel",
      type: "payment",
      amount: parseAmount(match[1]),
      currency: "RWF",
      referenceToken: match[3],
      transactionId: match[3],
      timestamp: new Date(),
      rawText: text,
    };
  }

  // Try received pattern
  match = text.match(AIRTEL_PATTERNS.received);
  if (match) {
    return {
      provider: "Airtel",
      type: "received",
      amount: parseAmount(match[1]),
      currency: "RWF",
      referenceToken: match[3],
      transactionId: match[3],
      timestamp: new Date(),
      rawText: text,
    };
  }

  // Try transaction pattern
  match = text.match(AIRTEL_PATTERNS.transaction);
  if (match) {
    return {
      provider: "Airtel",
      type: "payment",
      amount: parseAmount(match[1]),
      currency: "RWF",
      referenceToken: match[2],
      transactionId: match[2],
      timestamp: new Date(),
      rawText: text,
    };
  }

  return null;
}

/**
 * Parse amount string to number
 * Handles commas and spaces in numbers
 */
function parseAmount(amountStr: string): number {
  // Remove commas and spaces
  const cleaned = amountStr.replace(/[,\s]/g, "");
  const result = parseFloat(cleaned);

  // Return 0 if parsing fails
  return isNaN(result) ? 0 : result;
}

/**
 * Validate if parsed SMS contains required fields
 */
export function isValidParsedSMS(parsed: ParsedSMS | null): boolean {
  if (!parsed) return false;

  return (
    parsed.amount > 0 &&
    parsed.currency === "RWF" &&
    (parsed.type === "payment" || parsed.type === "received") &&
    !!parsed.referenceToken
  );
}

/**
 * Format parsed SMS for display
 */
export function formatParsedSMS(parsed: ParsedSMS): string {
  return `${parsed.provider} ${parsed.type}: ${parsed.currency} ${parsed.amount.toLocaleString()} (Ref: ${parsed.referenceToken})`;
}
