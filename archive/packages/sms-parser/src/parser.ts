/**
 * OpenAI SMS Parser
 * 
 * Uses OpenAI GPT-4 to parse mobile money SMS messages and extract
 * structured payment information.
 */

import OpenAI from 'openai';
import { z } from 'zod';
import type { ParsedSMS, PaymentProvider } from '@ibimina/types';
import { identifyProvider, getProviderTemplate } from './providers';

/**
 * OpenAI parser configuration
 */
export interface ParserConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

/**
 * Zod schema for parsed SMS validation
 */
const ParsedSMSSchema = z.object({
  provider: z.enum(['MTN', 'Airtel', 'Tigo', 'BK', 'Cash']),
  amount: z.number().positive(),
  sender: z.string().min(10).max(15),
  reference: z.string().min(3),
  timestamp: z.string().datetime(),
  transaction_type: z.string().optional(),
  balance: z.number().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

/**
 * SMS Parser class using OpenAI
 */
export class SMSParser {
  private openai: OpenAI;
  private config: Required<ParserConfig>;

  constructor(config: ParserConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'gpt-4-turbo-preview',
      temperature: config.temperature || 0.1,
      maxTokens: config.maxTokens || 500,
      timeout: config.timeout || 10000,
    };

    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      timeout: this.config.timeout,
    });
  }

  /**
   * Parse SMS message using OpenAI
   */
  async parse(smsBody: string, sender: string = ''): Promise<ParsedSMS> {
    const startTime = Date.now();

    try {
      // Pre-identify provider for better context
      const detectedProvider = identifyProvider(sender, smsBody);
      const template = detectedProvider ? getProviderTemplate(detectedProvider) : null;

      // Build prompt with provider-specific hints
      const prompt = this.buildPrompt(smsBody, template);

      // Call OpenAI
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert at parsing mobile money SMS notifications from Rwanda.
Extract payment information accurately. If you cannot determine a field with confidence, use reasonable defaults.
Current date/time for reference: ${new Date().toISOString()}`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse and validate response
      const parsed = JSON.parse(content);
      const validated = ParsedSMSSchema.parse(parsed);

      // Calculate confidence score
      const processingTime = Date.now() - startTime;
      const confidence = this.calculateConfidence(validated, smsBody, processingTime);

      return {
        ...validated,
        raw_sms: smsBody,
        confidence,
      };
    } catch (error) {
      throw new Error(`SMS parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build OpenAI prompt with context
   */
  private buildPrompt(smsBody: string, template: ReturnType<typeof getProviderTemplate>): string {
    let prompt = `Parse this mobile money SMS notification from Rwanda:\n\n"${smsBody}"\n\n`;

    if (template) {
      prompt += `Provider context:\n${template.extractionHints}\n\n`;
      prompt += `Example SMS format:\n${template.exampleSMS}\n\n`;
    }

    prompt += `Extract and return ONLY valid JSON with these fields:
{
  "provider": "MTN" | "Airtel" | "Tigo" | "BK" | "Cash",
  "amount": <number without commas>,
  "sender": "<phone number with 250 prefix>",
  "reference": "<transaction ID>",
  "timestamp": "<ISO 8601 datetime>",
  "transaction_type": "<deposit|withdrawal|transfer> (optional)",
  "balance": <number> (optional),
  "confidence": <0-1> (your confidence in extraction)
}

Important rules:
1. Amount must be numeric (remove commas, currency symbols)
2. Sender must be phone number (add 250 prefix if missing)
3. If timestamp not in SMS, use current time
4. Reference is the transaction ID from the SMS
5. Confidence: 0.9+ if all fields clear, 0.7-0.9 if some inference needed, <0.7 if highly uncertain`;

    return prompt;
  }

  /**
   * Calculate confidence score based on various factors
   */
  private calculateConfidence(
    parsed: z.infer<typeof ParsedSMSSchema>,
    originalSMS: string,
    processingTime: number
  ): number {
    let score = parsed.confidence || 0.8;

    // Adjust based on processing time (longer = less certain)
    if (processingTime > 5000) score -= 0.1;
    if (processingTime > 10000) score -= 0.1;

    // Verify amount is reasonable (RWF 100 to 10,000,000)
    if (parsed.amount < 100 || parsed.amount > 10_000_000) score -= 0.2;

    // Verify sender format
    if (!/^250\d{9}$/.test(parsed.sender)) score -= 0.1;

    // Verify reference exists
    if (!parsed.reference || parsed.reference.length < 5) score -= 0.1;

    // Check if amount appears in original SMS
    const amountStr = parsed.amount.toLocaleString();
    if (!originalSMS.includes(amountStr.replace(/,/g, ''))) score -= 0.15;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Batch parse multiple SMS messages
   */
  async parseBatch(messages: Array<{ body: string; sender: string }>): Promise<ParsedSMS[]> {
    const results = await Promise.allSettled(
      messages.map(msg => this.parse(msg.body, msg.sender))
    );

    return results
      .filter((r): r is PromiseFulfilledResult<ParsedSMS> => r.status === 'fulfilled')
      .map(r => r.value);
  }

  /**
   * Test parser with example messages
   */
  async test(): Promise<boolean> {
    const testMessage = `You have received 5,000 RWF from 250788123456. Transaction ID: MTN123456789. Your balance is now 45,000 RWF. Date: 03/11/2025 10:30 AM`;

    try {
      const result = await this.parse(testMessage, 'MTN');
      return result.confidence > 0.7;
    } catch {
      return false;
    }
  }
}

/**
 * Create parser instance
 */
export function createParser(config: ParserConfig): SMSParser {
  return new SMSParser(config);
}
