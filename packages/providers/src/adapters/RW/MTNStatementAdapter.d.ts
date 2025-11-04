/**
 * MTN Rwanda Statement Adapter
 * Parses MTN Rwanda mobile money statement CSV files
 */
import type { StatementAdapter, ParseResult } from "../../types/adapter.js";
export declare class MTNRwandaStatementAdapter implements StatementAdapter {
  readonly name = "MTN Rwanda";
  readonly countryISO3 = "RWA";
  /**
   * Expected CSV headers from MTN Rwanda statements
   * Format: Date, Time, Transaction ID, Details, Amount, Balance, etc.
   */
  getExpectedHeaders(): string[];
  /**
   * Validate headers loosely (case-insensitive, flexible matching)
   */
  validateHeaders(headers: string[]): boolean;
  /**
   * Check if this adapter can handle the input
   */
  canHandle(input: string): boolean;
  /**
   * Parse a CSV row from MTN Rwanda statement
   * Expected format: Date, Time, TxnID, Details, Amount, Balance, Status
   */
  parseRow(row: string[]): ParseResult;
  /**
   * Parse generic input (tries to detect format)
   */
  parse(input: string): ParseResult;
  /**
   * Parse amount from string (handles RWF, commas, etc.)
   */
  private parseAmount;
  /**
   * Parse timestamp from date and time strings
   */
  private parseTimestamp;
  /**
   * Extract reference token from details string
   * Looks for patterns like: RWA.NYA.GAS.TWIZ.001 or NYA.GAS.TWIZ.001
   */
  private extractReference;
  /**
   * Extract MSISDN from details string
   * Looks for Rwanda phone numbers (250XXXXXXXXX or 07XXXXXXXX)
   */
  private extractMsisdn;
  /**
   * Calculate confidence score based on parsed data quality
   */
  private calculateConfidence;
}
