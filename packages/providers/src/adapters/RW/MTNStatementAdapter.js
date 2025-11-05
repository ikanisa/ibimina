/**
 * MTN Rwanda Statement Adapter
 * Parses MTN Rwanda mobile money statement CSV files
 */
export class MTNRwandaStatementAdapter {
    name = "MTN Rwanda";
    countryISO3 = "RWA";
    /**
     * Expected CSV headers from MTN Rwanda statements
     * Format: Date, Time, Transaction ID, Details, Amount, Balance, etc.
     */
    getExpectedHeaders() {
        return ["Date", "Time", "Transaction ID", "Details", "Amount", "Balance", "Status"];
    }
    /**
     * Validate headers loosely (case-insensitive, flexible matching)
     */
    validateHeaders(headers) {
        const normalized = headers.map((h) => h.toLowerCase().trim());
        const required = ["date", "transaction", "amount"];
        return required.every((req) => normalized.some((h) => h.includes(req)));
    }
    /**
     * Check if this adapter can handle the input
     */
    canHandle(input) {
        const lower = input.toLowerCase();
        return (lower.includes("mtn") || lower.includes("mobile money") || /\d{4}-\d{2}-\d{2}/.test(input));
    }
    /**
     * Parse a CSV row from MTN Rwanda statement
     * Expected format: Date, Time, TxnID, Details, Amount, Balance, Status
     */
    parseRow(row) {
        try {
            if (row.length < 5) {
                return {
                    success: false,
                    confidence: 0,
                    error: "Insufficient columns in row",
                };
            }
            // Extract fields (adjust indices based on actual MTN format)
            const date = row[0]?.trim() || "";
            const time = row[1]?.trim() || "";
            const txnId = row[2]?.trim() || "";
            const details = row[3]?.trim() || "";
            const amountStr = row[4]?.trim() || "";
            const balanceStr = row[5]?.trim() || "";
            // Parse amount (remove currency symbols and commas)
            const amount = this.parseAmount(amountStr);
            if (amount === null) {
                return {
                    success: false,
                    confidence: 0.3,
                    error: "Could not parse amount",
                };
            }
            // Parse timestamp
            const timestamp = this.parseTimestamp(date, time);
            if (!timestamp) {
                return {
                    success: false,
                    confidence: 0.5,
                    error: "Could not parse timestamp",
                };
            }
            // Extract reference from details (e.g., "Payment for: RWA.NYA.GAS.TWIZ.001")
            const reference = this.extractReference(details);
            // Extract payer MSISDN if present
            const msisdn = this.extractMsisdn(details);
            const transaction = {
                amount,
                txn_id: txnId,
                timestamp,
                payer_msisdn: msisdn,
                raw_reference: reference,
                balance: this.parseAmount(balanceStr) ?? undefined,
                raw_data: {
                    date,
                    time,
                    details,
                    status: row[6]?.trim(),
                },
            };
            return {
                success: true,
                transaction,
                confidence: this.calculateConfidence(transaction),
            };
        }
        catch (error) {
            return {
                success: false,
                confidence: 0,
                error: error instanceof Error ? error.message : "Parse error",
            };
        }
    }
    /**
     * Parse generic input (tries to detect format)
     */
    parse(input) {
        // Split by common delimiters
        const row = input.split(/[,\t;|]/);
        return this.parseRow(row);
    }
    /**
     * Parse amount from string (handles RWF, commas, etc.)
     */
    parseAmount(amountStr) {
        if (!amountStr)
            return null;
        // Remove currency symbols, commas, spaces
        const cleaned = amountStr.replace(/[RWF,\s]/gi, "").replace(/[^\d.-]/g, "");
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : Math.abs(parsed);
    }
    /**
     * Parse timestamp from date and time strings
     */
    parseTimestamp(date, time) {
        try {
            // Try ISO format first
            if (date.includes("-")) {
                const combined = time ? `${date}T${time}` : date;
                const parsed = new Date(combined);
                if (!isNaN(parsed.getTime()))
                    return parsed;
            }
            // Try other formats (DD/MM/YYYY, etc.)
            const parsed = new Date(`${date} ${time}`);
            return isNaN(parsed.getTime()) ? null : parsed;
        }
        catch {
            return null;
        }
    }
    /**
     * Extract reference token from details string
     * Looks for patterns like: RWA.NYA.GAS.TWIZ.001 or NYA.GAS.TWIZ.001
     */
    extractReference(details) {
        // Pattern: 3-4 uppercase letters/digits, separated by dots
        const match = details.match(/\b([A-Z]{3}\.[A-Z0-9]{3}\.[A-Z0-9]{3,4}\.[A-Z0-9]{3,4}\.[0-9]{3})\b/i);
        if (match)
            return match[1];
        // Legacy pattern (4 parts)
        const legacyMatch = details.match(/\b([A-Z]{3}\.[A-Z0-9]{3,4}\.[A-Z0-9]{3,4}\.[0-9]{3})\b/i);
        return legacyMatch?.[1];
    }
    /**
     * Extract MSISDN from details string
     * Looks for Rwanda phone numbers (250XXXXXXXXX or 07XXXXXXXX)
     */
    extractMsisdn(details) {
        // International format
        const intlMatch = details.match(/\b(250\d{9})\b/);
        if (intlMatch)
            return intlMatch[1];
        // Local format
        const localMatch = details.match(/\b(07\d{8})\b/);
        if (localMatch)
            return `250${localMatch[1].substring(1)}`;
        return undefined;
    }
    /**
     * Calculate confidence score based on parsed data quality
     */
    calculateConfidence(txn) {
        let score = 0.6; // Base confidence
        if (txn.txn_id && txn.txn_id.length > 5)
            score += 0.15;
        if (txn.raw_reference)
            score += 0.15;
        if (txn.payer_msisdn)
            score += 0.1;
        return Math.min(score, 1.0);
    }
}
