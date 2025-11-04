/**
 * MTN Rwanda SMS Adapter
 * Parses MTN Rwanda mobile money SMS confirmation messages
 */
import type { SmsAdapter, ParseResult } from "../../types/adapter.js";
export declare class MTNRwandaSmsAdapter implements SmsAdapter {
  readonly name = "MTN Rwanda SMS";
  readonly countryISO3 = "RWA";
  /**
   * Known MTN Rwanda SMS sender IDs
   */
  getSenderPatterns(): string[];
  /**
   * Check if this adapter can handle the SMS
   */
  canHandle(input: string): boolean;
  /**
   * Parse MTN Rwanda SMS text
   * Example format:
   * "You have received RWF 5,000 from 250788123456.
   *  Transaction ID: MP240123.1234.A12345.
   *  Reference: RWA.NYA.GAS.TWIZ.001.
   *  Balance: RWF 15,000"
   */
  parseSms(smsText: string): ParseResult;
  /**
   * Parse generic input (alias for parseSms)
   */
  parse(input: string): ParseResult;
  /**
   * Extract amount from SMS text
   */
  private extractAmount;
  /**
   * Extract transaction ID from SMS
   */
  private extractTxnId;
  /**
   * Extract MSISDN from SMS
   */
  private extractMsisdn;
  /**
   * Extract reference token from SMS
   */
  private extractReference;
  /**
   * Extract balance from SMS
   */
  private extractBalance;
  /**
   * Calculate confidence score
   */
  private calculateConfidence;
}
