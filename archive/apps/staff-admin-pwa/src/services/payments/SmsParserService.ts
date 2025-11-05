import OpenAI from 'openai';

export interface ParsedPayment {
  provider: 'mtn' | 'airtel' | 'tigo' | 'unknown';
  transactionRef: string;
  amount: number;
  currency: string;
  senderPhone?: string;
  senderName?: string;
  timestamp?: string;
  confidence: number; // 0.0 to 1.0
  rawData?: Record<string, unknown>;
}

export interface ParsingMetadata {
  model: string;
  tokensUsed: number;
  processingTime: number;
}

export class SmsParserService {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.openai = new OpenAI({ 
      apiKey, 
      dangerouslyAllowBrowser: true // Only for demo - move to backend in production!
    });
    this.model = model;
  }

  async parseSms(sender: string, body: string): Promise<{ payment: ParsedPayment; metadata: ParsingMetadata }> {
    const startTime = Date.now();

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: this.buildPrompt(sender, body),
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1, // Low temperature for consistent extraction
        max_tokens: 500,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(content);
      
      const payment: ParsedPayment = {
        provider: this.detectProvider(sender, body),
        transactionRef: parsed.transaction_ref || '',
        amount: parseFloat(parsed.amount) || 0,
        currency: parsed.currency || 'RWF',
        senderPhone: this.cleanPhone(parsed.sender_phone),
        senderName: this.cleanName(parsed.sender_name),
        timestamp: parsed.timestamp,
        confidence: Math.min(parseFloat(parsed.confidence) || 0.5, 1.0),
        rawData: parsed,
      };

      const metadata: ParsingMetadata = {
        model: this.model,
        tokensUsed: response.usage?.total_tokens || 0,
        processingTime: Date.now() - startTime,
      };

      return { payment, metadata };
      
    } catch (error) {
      console.error('OpenAI SMS parsing failed:', error);
      
      // Fallback to regex-based parsing
      const payment = this.fallbackParse(sender, body);
      const metadata: ParsingMetadata = {
        model: 'fallback-regex',
        tokensUsed: 0,
        processingTime: Date.now() - startTime,
      };

      return { payment, metadata };
    }
  }

  private getSystemPrompt(): string {
    return `You are an expert at parsing mobile money payment SMS notifications from Rwanda (MTN Mobile Money, Airtel Money, Tigo Cash).

Extract the following information from SMS text and return ONLY valid JSON:

{
  "transaction_ref": "string - transaction/reference ID or code",
  "amount": "number - payment amount (digits only, no commas)",
  "currency": "string - currency code (RWF, USD, etc.)",
  "sender_phone": "string - sender's phone number",
  "sender_name": "string - sender's full name",
  "timestamp": "string - transaction date/time if mentioned",
  "confidence": "number - your confidence 0.0 to 1.0"
}

IMPORTANT RULES:
1. Extract ONLY numeric digits for amount (remove commas, currency symbols, spaces)
2. Phone numbers should start with 250 for Rwanda (add if missing)
3. If sender_phone starts with 0, replace with 250 (e.g., 0788123456 → 250788123456)
4. If sender_phone is 9 digits, add 250 prefix (e.g., 788123456 → 250788123456)
5. Use empty string "" for missing text fields
6. Use 0 for missing numeric fields
7. Be VERY conservative with confidence (0.5-0.7 is typical, 0.9+ for perfect matches)
8. Look for keywords: received, sent, from, to, amount, balance, ref, txn, transaction

REAL EXAMPLES FROM RWANDA:

Input: "You have received 5000 RWF from UWIMANA Jean (250788123456). Ref: MP123456789. New balance: 15000 RWF"
Output: {"transaction_ref": "MP123456789", "amount": 5000, "currency": "RWF", "sender_phone": "250788123456", "sender_name": "UWIMANA Jean", "timestamp": "", "confidence": 0.95}

Input: "You received RWF 3,000 from 0788123456 (MUKAMANA Alice). TxnID: AM987654. Bal: RWF 8,000"
Output: {"transaction_ref": "AM987654", "amount": 3000, "currency": "RWF", "sender_phone": "250788123456", "sender_name": "MUKAMANA Alice", "timestamp": "", "confidence": 0.90}

Input: "Payment received: 2000 RWF from 788123456. Ref: TG555444. Available: 6000"
Output: {"transaction_ref": "TG555444", "amount": 2000, "currency": "RWF", "sender_phone": "250788123456", "sender_name": "", "timestamp": "", "confidence": 0.75}

Input: "Mwakiriye 15,000 FRW kuri konti yanyu kuva kuri NKUSI Paul. Nimero: MP111222333"
Output: {"transaction_ref": "MP111222333", "amount": 15000, "currency": "RWF", "sender_phone": "", "sender_name": "NKUSI Paul", "timestamp": "", "confidence": 0.80}

Return ONLY the JSON object, no other text.`;
  }

  private buildPrompt(sender: string, body: string): string {
    return `SMS Sender: ${sender}
SMS Body: ${body}

Parse this mobile money payment notification and extract the payment details as JSON.`;
  }

  private detectProvider(sender: string, body: string): ParsedPayment['provider'] {
    const text = (sender + ' ' + body).toLowerCase();
    
    if (text.includes('mtn') || text.includes('momo') || text.includes('*182')) return 'mtn';
    if (text.includes('airtel') || text.includes('*500')) return 'airtel';
    if (text.includes('tigo')) return 'tigo';
    
    // Check transaction ref patterns
    if (/MP\d+/.test(body)) return 'mtn'; // MTN refs start with MP
    if (/AM\d+/.test(body)) return 'airtel'; // Airtel refs start with AM
    if (/TG\d+/.test(body)) return 'tigo'; // Tigo refs start with TG
    
    return 'unknown';
  }

  private cleanPhone(phone?: string): string | undefined {
    if (!phone) return undefined;
    
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    
    if (!cleaned) return undefined;
    
    // Add Rwanda country code if missing
    if (cleaned.length === 9) {
      // 788123456 → 250788123456
      cleaned = '250' + cleaned;
    } else if (cleaned.length === 10 && cleaned.startsWith('0')) {
      // 0788123456 → 250788123456
      cleaned = '250' + cleaned.substring(1);
    } else if (cleaned.length === 12 && !cleaned.startsWith('250')) {
      // Might have wrong country code
      return undefined;
    }
    
    // Validate length
    if (cleaned.length !== 12) {
      return undefined;
    }
    
    // Validate starts with 250
    if (!cleaned.startsWith('250')) {
      return undefined;
    }
    
    return cleaned;
  }

  private cleanName(name?: string): string | undefined {
    if (!name) return undefined;
    
    // Remove extra spaces, trim
    const cleaned = name.replace(/\s+/g, ' ').trim();
    
    // Must have at least 2 characters
    if (cleaned.length < 2) return undefined;
    
    // Capitalize each word
    return cleaned
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private fallbackParse(sender: string, body: string): ParsedPayment {
    console.log('Using fallback regex parsing');

    // Extract amount (with or without commas)
    const amountMatch = body.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:RWF|FRW)/i);
    const amountStr = amountMatch?.[1]?.replace(/,/g, '') || '0';
    
    // Extract phone number
    const phoneMatch = body.match(/(?:250|0)?([0-9]{9})/);
    const rawPhone = phoneMatch ? phoneMatch[0] : undefined;
    
    // Extract transaction reference
    const refMatch = body.match(/(?:Ref|TxnID|Transaction|ID|Nimero)[:\s]*([A-Z0-9]+)/i);
    
    // Extract name (text between parentheses or after "from")
    const nameMatch = body.match(/\(([^)]+)\)|from\s+([A-Z\s]+)/i);
    const rawName = nameMatch?.[1] || nameMatch?.[2];
    
    return {
      provider: this.detectProvider(sender, body),
      transactionRef: refMatch?.[1] || '',
      amount: parseFloat(amountStr) || 0,
      currency: 'RWF',
      senderPhone: this.cleanPhone(rawPhone),
      senderName: this.cleanName(rawName),
      confidence: 0.5, // Low confidence for fallback parsing
    };
  }

  /**
   * Validate parsed payment data
   */
  validatePayment(payment: ParsedPayment): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (payment.amount <= 0) {
      errors.push('Amount must be positive');
    }

    if (payment.amount > 100000000) {
      errors.push('Amount too large (>100M)');
    }

    if (!payment.currency || payment.currency.length !== 3) {
      errors.push('Invalid currency code');
    }

    if (payment.senderPhone && payment.senderPhone.length !== 12) {
      errors.push('Invalid phone number length');
    }

    if (payment.confidence < 0 || payment.confidence > 1) {
      errors.push('Invalid confidence score');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
