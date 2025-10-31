/**
 * MTN Rwanda SMS Adapter
 * Parses MTN Rwanda mobile money SMS confirmation messages
 */

import type {
  SmsAdapter,
  ParseResult,
  ParsedTransaction,
} from '../../types/adapter.js';

export class MTNRwandaSmsAdapter implements SmsAdapter {
  readonly name = 'MTN Rwanda SMS';
  readonly countryISO3 = 'RWA';

  /**
   * Known MTN Rwanda SMS sender IDs
   */
  getSenderPatterns(): string[] {
    return ['MTN', 'MoMo', 'MTN-MM', 'MTN MOBILE MONEY'];
  }

  /**
   * Check if this adapter can handle the SMS
   */
  canHandle(input: string): boolean {
    const lower = input.toLowerCase();
    return (
      (lower.includes('mtn') || lower.includes('momo')) &&
      (lower.includes('received') ||
        lower.includes('sent') ||
        lower.includes('rwf') ||
        lower.includes('confirmed'))
    );
  }

  /**
   * Parse MTN Rwanda SMS text
   * Example format:
   * "You have received RWF 5,000 from 250788123456. 
   *  Transaction ID: MP240123.1234.A12345. 
   *  Reference: RWA.NYA.GAS.TWIZ.001. 
   *  Balance: RWF 15,000"
   */
  parseSms(smsText: string): ParseResult {
    try {
      // Extract amount
      const amount = this.extractAmount(smsText);
      if (amount === null) {
        return {
          success: false,
          confidence: 0.2,
          error: 'Could not extract amount from SMS',
        };
      }

      // Extract transaction ID
      const txnId = this.extractTxnId(smsText);
      if (!txnId) {
        return {
          success: false,
          confidence: 0.4,
          error: 'Could not extract transaction ID from SMS',
        };
      }

      // Extract timestamp (use current time if not in SMS)
      const timestamp = new Date();

      // Extract sender MSISDN
      const msisdn = this.extractMsisdn(smsText);

      // Extract reference
      const reference = this.extractReference(smsText);

      // Extract balance
      const balance = this.extractBalance(smsText);

      const transaction: ParsedTransaction = {
        amount,
        txn_id: txnId,
        timestamp,
        payer_msisdn: msisdn,
        raw_reference: reference,
        balance,
        raw_data: {
          sms_text: smsText,
          parsed_at: new Date().toISOString(),
        },
      };

      return {
        success: true,
        transaction,
        confidence: this.calculateConfidence(transaction),
      };
    } catch (error) {
      return {
        success: false,
        confidence: 0,
        error: error instanceof Error ? error.message : 'SMS parse error',
      };
    }
  }

  /**
   * Parse generic input (alias for parseSms)
   */
  parse(input: string): ParseResult {
    return this.parseSms(input);
  }

  /**
   * Extract amount from SMS text
   */
  private extractAmount(text: string): number | null {
    // Pattern: "RWF 5,000" or "5000 RWF" or "5,000.00"
    const patterns = [
      /RWF\s*([\d,]+(?:\.\d{2})?)/i,
      /([\d,]+(?:\.\d{2})?)\s*RWF/i,
      /amount[:\s]*([\d,]+(?:\.\d{2})?)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const cleaned = match[1].replace(/,/g, '');
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed)) return parsed;
      }
    }

    return null;
  }

  /**
   * Extract transaction ID from SMS
   */
  private extractTxnId(text: string): string | undefined {
    // Pattern: "Transaction ID: MP240123.1234.A12345" or "TxnID: ABC123"
    const patterns = [
      /transaction\s+id[:\s]+([A-Z0-9.]+)/i,
      /txn\s*id[:\s]+([A-Z0-9.]+)/i,
      /ref[:\s]+([A-Z0-9.]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1].length >= 6) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Extract MSISDN from SMS
   */
  private extractMsisdn(text: string): string | undefined {
    // Pattern: 250XXXXXXXXX or 07XXXXXXXX
    const intlMatch = text.match(/\b(250\d{9})\b/);
    if (intlMatch) return intlMatch[1];

    const localMatch = text.match(/\b(07\d{8})\b/);
    if (localMatch) return `250${localMatch[1].substring(1)}`;

    return undefined;
  }

  /**
   * Extract reference token from SMS
   */
  private extractReference(text: string): string | undefined {
    // Pattern: "Reference: RWA.NYA.GAS.TWIZ.001"
    const match = text.match(
      /reference[:\s]+([A-Z]{3}\.[A-Z0-9]{3}\.[A-Z0-9]{3,4}\.[A-Z0-9]{3,4}\.[0-9]{3})/i,
    );
    if (match) return match[1];

    // Look for reference pattern anywhere in text
    const patternMatch = text.match(
      /\b([A-Z]{3}\.[A-Z0-9]{3}\.[A-Z0-9]{3,4}\.[A-Z0-9]{3,4}\.[0-9]{3})\b/i,
    );
    return patternMatch?.[1];
  }

  /**
   * Extract balance from SMS
   */
  private extractBalance(text: string): number | undefined {
    // Pattern: "Balance: RWF 15,000"
    const match = text.match(/balance[:\s]+RWF\s*([\d,]+(?:\.\d{2})?)/i);
    if (match) {
      const cleaned = match[1].replace(/,/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(txn: ParsedTransaction): number {
    let score = 0.5; // Base SMS confidence (lower than statement)

    if (txn.txn_id && txn.txn_id.length > 8) score += 0.2;
    if (txn.raw_reference) score += 0.2;
    if (txn.payer_msisdn) score += 0.1;

    return Math.min(score, 1.0);
  }
}
