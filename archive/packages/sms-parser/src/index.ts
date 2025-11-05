/**
 * @ibimina/sms-parser
 * 
 * SMS payment parsing for mobile money integration.
 * Uses OpenAI to extract structured payment data from SMS notifications.
 * 
 * @example
 * ```typescript
 * import { createParser } from '@ibimina/sms-parser';
 * 
 * const parser = createParser({
 *   apiKey: process.env.OPENAI_API_KEY
 * });
 * 
 * const result = await parser.parse(smsBody, senderAddress);
 * console.log(result.amount, result.sender, result.reference);
 * ```
 */

export { SMSParser, createParser, type ParserConfig } from './parser';

export {
  PROVIDER_TEMPLATES,
  MTN_TEMPLATE,
  AIRTEL_TEMPLATE,
  TIGO_TEMPLATE,
  BANK_TEMPLATE,
  identifyProvider,
  getProviderTemplate,
  matchesProviderPattern,
  type ProviderTemplate,
} from './providers';

// Re-export types from @ibimina/types for convenience
export type { ParsedSMS, PaymentProvider, PaymentAllocationResult } from '@ibimina/types';
