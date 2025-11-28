/**
 * Document Intelligence Service
 * Uses Gemini Vision to extract data from receipts, IDs, and bank statements
 */

import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { gemini, GeminiError } from './gemini-client';
import { createClient } from '@supabase/supabase-js';
import { AI_CONFIG } from '../config/ai-config';
import type {
  DocumentAnalysisResult,
  ReceiptData,
  IDCardData,
  BankStatementData,
  BatchProcessingResult,
  ProcessingResult,
} from './types';

export class DocumentIntelligence {
  private supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  );

  /**
   * Analyze any document using Gemini Vision
   */
  async analyzeDocument(
    imageData: Uint8Array,
    mimeType: string,
    fileName?: string
  ): Promise<DocumentAnalysisResult> {
    const startTime = Date.now();

    // Validate file size
    if (imageData.length > AI_CONFIG.documentScanning.maxFileSizeMB * 1024 * 1024) {
      throw new Error(
        `File too large. Max size: ${AI_CONFIG.documentScanning.maxFileSizeMB}MB`
      );
    }

    // Validate MIME type
    if (!AI_CONFIG.documentScanning.allowedMimeTypes.includes(mimeType)) {
      throw new Error(
        `Unsupported file type. Allowed: ${AI_CONFIG.documentScanning.allowedMimeTypes.join(', ')}`
      );
    }

    // Get user and organization info
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data: orgData } = await this.supabase
      .from('staff_assignments')
      .select('organization_id, country_id')
      .eq('user_id', user.id)
      .single();

    if (!orgData) {
      throw new Error('User not assigned to any organization');
    }

    // Create database record
    const { data: scanRecord, error: insertError } = await this.supabase
      .from('document_scans')
      .insert({
        organization_id: orgData.organization_id,
        country_id: orgData.country_id,
        uploaded_by: user.id,
        file_name: fileName || 'uploaded-document',
        file_size: imageData.length,
        mime_type: mimeType,
        status: 'processing',
      })
      .select()
      .single();

    if (insertError || !scanRecord) {
      throw new Error('Failed to create scan record');
    }

    try {
      // Convert to base64
      const base64Image = this.arrayBufferToBase64(imageData);

      // Call Gemini Vision
      const response = await gemini.generateContent({
        contents: [{
          parts: [
            {
              text: `Analyze this document image and extract all relevant information. 
              
Determine the document type from: receipt, id_card, bank_statement, contract, or unknown.

For receipts (MoMo/bank), extract: 
- merchant name
- transaction ID
- amount (numeric)
- currency (usually RWF for Rwanda)
- date (ISO format)
- payer phone (E.164 format if possible)
- payer name
- reference code

For ID cards (Rwandan National ID), extract:
- full name
- national ID number (16 digits)
- date of birth (YYYY-MM-DD)
- gender (Male/Female)
- district, sector, cell
- issue date, expiry date if visible

For bank statements, extract:
- account holder name
- account number
- statement period
- list of transactions

Return a JSON object with:
{
  "type": "receipt|id_card|bank_statement|contract|unknown",
  "confidence": 0.0-1.0,
  "extractedData": { ... extracted fields ... },
  "suggestions": ["suggestion1", "suggestion2"],
  "warnings": ["warning1 if suspicious", "warning2"]
}

Be thorough and accurate. Flag any unclear or suspicious information in warnings.`
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image,
              },
            },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('No response from Gemini Vision');
      }

      const result = JSON.parse(text) as DocumentAnalysisResult;
      const processingTime = Date.now() - startTime;

      // Update database record with results
      await this.supabase
        .from('document_scans')
        .update({
          document_type: result.type,
          confidence: result.confidence,
          extracted_data: result.extractedData,
          suggestions: result.suggestions,
          warnings: result.warnings,
          status: 'processed',
          processing_time_ms: processingTime,
          processed_at: new Date().toISOString(),
        })
        .eq('id', scanRecord.id);

      return result;

    } catch (error) {
      // Update database record with error
      await this.supabase
        .from('document_scans')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          processing_time_ms: Date.now() - startTime,
        })
        .eq('id', scanRecord.id);

      throw error;
    }
  }

  /**
   * Scan and extract data from a MoMo receipt
   */
  async scanMoMoReceipt(imageData: Uint8Array): Promise<ReceiptData> {
    const base64Image = this.arrayBufferToBase64(imageData);

    const response = await gemini.generateContent({
      contents: [{
        parts: [
          {
            text: `This is a Mobile Money (MoMo) receipt from Rwanda. Extract the following:

1. Transaction ID (usually alphanumeric)
2. Amount in RWF (numeric only)
3. Sender/Payer phone number (format: +250XXXXXXXXX or 078XXXXXXX)
4. Sender/Payer name
5. Transaction date and time (ISO 8601 format)
6. Reference code if any
7. Merchant/recipient information

Return JSON:
{
  "transactionId": "string",
  "amount": number,
  "currency": "RWF",
  "payerPhone": "string (E.164 format: +250...)",
  "payerName": "string",
  "date": "ISO 8601 string",
  "reference": "string or null",
  "merchantName": "string",
  "confidence": 0.0-1.0
}

If any field is unclear, use null. Normalize phone numbers to +250 format.`
          },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64Image,
            },
          },
        ],
      }],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No response from Gemini');
    }

    return JSON.parse(text) as ReceiptData;
  }

  /**
   * Scan Rwandan National ID card
   */
  async scanNationalID(imageData: Uint8Array): Promise<IDCardData> {
    const base64Image = this.arrayBufferToBase64(imageData);

    const response = await gemini.generateContent({
      contents: [{
        parts: [
          {
            text: `This is a Rwandan National ID card. Extract:

1. Full name (IZINA RYUZUYE)
2. National ID number (16 digits, format: 1 1990 8 0123456 0 12)
3. Date of birth (YYYY-MM-DD)
4. Gender (Male/Female)
5. Place of birth - District, Sector, Cell
6. Issue date and expiry date if visible

Return JSON:
{
  "fullName": "string",
  "nationalId": "string (formatted with spaces)",
  "dateOfBirth": "YYYY-MM-DD",
  "gender": "Male" or "Female",
  "district": "string",
  "sector": "string",
  "cell": "string",
  "issueDate": "YYYY-MM-DD or null",
  "expiryDate": "YYYY-MM-DD or null",
  "isValid": boolean,
  "warnings": ["array of any issues detected"]
}`
          },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64Image,
            },
          },
        ],
      }],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No response from Gemini');
    }

    return JSON.parse(text) as IDCardData;
  }

  /**
   * Batch process multiple documents
   */
  async batchAnalyze(
    files: Array<{ data: Uint8Array; mimeType: string; name: string }>
  ): Promise<BatchProcessingResult<DocumentAnalysisResult>> {
    const results = new Map<string, ProcessingResult<DocumentAnalysisResult>>();
    let successful = 0;
    let failed = 0;

    // Process in batches of 3 (to avoid rate limits)
    const concurrency = 3;

    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);

      const batchResults = await Promise.allSettled(
        batch.map(async (file) => {
          const startTime = Date.now();
          try {
            const result = await this.analyzeDocument(file.data, file.mimeType, file.name);
            return {
              name: file.name,
              success: true,
              data: result,
              processingTime: Date.now() - startTime,
            };
          } catch (error) {
            return {
              name: file.name,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              processingTime: Date.now() - startTime,
            };
          }
        })
      );

      // Collect results
      batchResults.forEach((result, index) => {
        const fileName = batch[index].name;
        if (result.status === 'fulfilled') {
          const { success, data, error, processingTime } = result.value;
          results.set(fileName, { success, data, error, processingTime });
          if (success) successful++;
          else failed++;
        } else {
          results.set(fileName, {
            success: false,
            error: result.reason,
            processingTime: 0,
          });
          failed++;
        }
      });
    }

    return {
      total: files.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Open file dialog and scan document
   */
  async scanFromFile(): Promise<{ file: string; result: DocumentAnalysisResult } | null> {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: 'Documents',
          extensions: ['png', 'jpg', 'jpeg', 'webp', 'pdf'],
        },
      ],
    });

    if (!selected) return null;

    const filePath = selected as string;
    const fileData = await readFile(filePath);
    const mimeType = this.getMimeType(filePath);
    const fileName = filePath.split('/').pop() || 'document';

    const result = await this.analyzeDocument(fileData, mimeType, fileName);

    return { file: filePath, result };
  }

  /**
   * Get recent scans for current user
   */
  async getRecentScans(limit: number = 10) {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await this.supabase
      .from('document_scans')
      .select('*')
      .eq('uploaded_by', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // Helper methods

  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < buffer.length; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      pdf: 'application/pdf',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}

// Singleton instance
export const documentIntelligence = new DocumentIntelligence();
