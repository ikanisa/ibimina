/**
 * Provider Adapter Types
 * Defines interfaces for country/telco-specific ingestion adapters
 */
/**
 * Parsed transaction data from statement or SMS
 */
export interface ParsedTransaction {
  amount: number;
  txn_id: string;
  timestamp: Date;
  payer_msisdn?: string;
  raw_reference?: string;
  merchant_code?: string;
  fee?: number;
  balance?: number;
  raw_data: Record<string, unknown>;
}
/**
 * Parse result with confidence score
 */
export interface ParseResult {
  success: boolean;
  transaction?: ParsedTransaction;
  confidence: number;
  error?: string;
  warnings?: string[];
}
/**
 * Base adapter interface for statement/SMS parsing
 */
export interface ProviderAdapter {
  /**
   * Provider name (e.g., 'MTN Rwanda', 'Orange Senegal')
   */
  readonly name: string;
  /**
   * Country ISO3 code (e.g., 'RWA', 'SEN')
   */
  readonly countryISO3: string;
  /**
   * Parse a statement line or SMS text
   */
  parse(input: string): ParseResult;
  /**
   * Validate if this adapter can handle the input
   */
  canHandle(input: string): boolean;
}
/**
 * Statement adapter for CSV/Excel file parsing
 */
export interface StatementAdapter extends ProviderAdapter {
  /**
   * Parse CSV row (array of cell values)
   */
  parseRow(row: string[]): ParseResult;
  /**
   * Get expected CSV headers
   */
  getExpectedHeaders(): string[];
  /**
   * Validate headers match expected format
   */
  validateHeaders(headers: string[]): boolean;
}
/**
 * SMS adapter for mobile money confirmation messages
 */
export interface SmsAdapter extends ProviderAdapter {
  /**
   * Extract transaction from SMS text
   */
  parseSms(smsText: string): ParseResult;
  /**
   * Get SMS sender patterns (for filtering)
   */
  getSenderPatterns(): string[];
}
/**
 * Adapter registry entry
 */
export interface AdapterRegistryEntry {
  adapter: ProviderAdapter;
  type: "statement" | "sms";
  countryISO3: string;
  providerName: string;
  priority: number;
}
