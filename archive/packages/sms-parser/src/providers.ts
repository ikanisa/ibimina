/**
 * SMS Provider Templates for Rwanda Mobile Money Services
 * 
 * These templates help identify and parse SMS messages from different
 * mobile money providers in Rwanda.
 */

import type { PaymentProvider } from '@ibimina/types';

export interface ProviderTemplate {
  provider: PaymentProvider;
  senderIdentifiers: string[];  // SMS sender names/numbers
  patterns: RegExp[];            // Regex patterns to match
  exampleSMS: string;            // Example SMS for testing
  extractionHints: string;       // Hints for OpenAI extraction
}

/**
 * MTN Mobile Money Rwanda Templates
 */
export const MTN_TEMPLATE: ProviderTemplate = {
  provider: 'MTN',
  senderIdentifiers: ['MTN', 'MoMo', 'MTN MoMo', 'MTN Rwanda'],
  patterns: [
    /You have received ([\d,]+) RWF from (\d+)/i,
    /Received ([\d,]+) from (\+?\d+)/i,
    /Transaction.*?(\d+).*?Amount.*?([\d,]+)/i,
  ],
  exampleSMS: `You have received 5,000 RWF from 250788123456. 
Transaction ID: MTN123456789. 
Your balance is now 45,000 RWF.
Date: 03/11/2025 10:30 AM`,
  extractionHints: `
MTN MoMo SMS messages typically include:
- Amount in format "X,XXX RWF" or "X XXX RWF"
- Sender phone number (250XXXXXXXXX format)
- Transaction ID (starts with MTN or numbers)
- Date and time
- New balance (optional)

Extract:
- provider: "MTN"
- amount: numeric value without commas
- sender: phone number with country code
- reference: transaction ID
- timestamp: ISO 8601 format
  `
};

/**
 * Airtel Money Rwanda Templates
 */
export const AIRTEL_TEMPLATE: ProviderTemplate = {
  provider: 'Airtel',
  senderIdentifiers: ['Airtel', 'Airtel Money', 'AIRTEL'],
  patterns: [
    /You.*?received.*?([\d,]+).*?from.*?(\d+)/i,
    /Deposit.*?([\d,]+).*?(\d+)/i,
    /Ref.*?(\w+)/i,
  ],
  exampleSMS: `Dear customer, you have received RWF 10,000 from 250733987654. 
Ref: AIR987654321
Balance: RWF 60,000
Thank you for using Airtel Money`,
  extractionHints: `
Airtel Money SMS format:
- Greeting: "Dear customer"
- Amount in "RWF X,XXX" format
- Sender phone number
- Reference with "Ref:" prefix
- Balance update

Extract:
- provider: "Airtel"
- amount: numeric (remove commas)
- sender: 250XXXXXXXXX format
- reference: alphanumeric ID after "Ref:"
- timestamp: current time if not in SMS
  `
};

/**
 * Tigo Cash Rwanda Templates (if applicable)
 */
export const TIGO_TEMPLATE: ProviderTemplate = {
  provider: 'Tigo',
  senderIdentifiers: ['Tigo', 'TigoCash', 'TIGO'],
  patterns: [
    /Received.*?([\d,]+).*?from.*?(\d+)/i,
    /TXN.*?(\w+)/i,
  ],
  exampleSMS: `TigoCash: Received 7,500 RWF from 250722456789. 
TXN: TG20251103001. 
Available: 32,500 RWF`,
  extractionHints: `
Tigo Cash format:
- Starts with "TigoCash:"
- Amount format varies
- Transaction ID with "TXN:" prefix

Extract:
- provider: "Tigo"
- amount: numeric
- sender: phone with 250 prefix
- reference: transaction ID
  `
};

/**
 * Bank transfer SMS templates
 */
export const BANK_TEMPLATE: ProviderTemplate = {
  provider: 'BK',
  senderIdentifiers: ['BK', 'Bank of Kigali', 'BankKigali', 'IKOFI'],
  patterns: [
    /Received.*?([\d,]+).*?from.*?Account.*?(\d+)/i,
    /Transfer.*?([\d,]+)/i,
  ],
  exampleSMS: `Bank of Kigali: Received RWF 50,000 from Account ****5678. 
Ref: BK2025110312345. 
Your balance: RWF 125,000`,
  extractionHints: `
Bank transfer format:
- Bank name in sender
- Amount in RWF
- Masked account number
- Bank reference number

Extract:
- provider: "BK"
- amount: numeric
- sender: account number (last 4 digits)
- reference: BK transaction ID
  `
};

/**
 * All provider templates registry
 */
export const PROVIDER_TEMPLATES: ProviderTemplate[] = [
  MTN_TEMPLATE,
  AIRTEL_TEMPLATE,
  TIGO_TEMPLATE,
  BANK_TEMPLATE,
];

/**
 * Identify provider from SMS sender or body
 */
export function identifyProvider(sender: string, body: string): PaymentProvider | null {
  const text = `${sender} ${body}`.toUpperCase();
  
  for (const template of PROVIDER_TEMPLATES) {
    for (const identifier of template.senderIdentifiers) {
      if (text.includes(identifier.toUpperCase())) {
        return template.provider;
      }
    }
  }
  
  return null;
}

/**
 * Get template for provider
 */
export function getProviderTemplate(provider: PaymentProvider): ProviderTemplate | undefined {
  return PROVIDER_TEMPLATES.find(t => t.provider === provider);
}

/**
 * Check if SMS matches any provider patterns
 */
export function matchesProviderPattern(body: string): boolean {
  return PROVIDER_TEMPLATES.some(template =>
    template.patterns.some(pattern => pattern.test(body))
  );
}
