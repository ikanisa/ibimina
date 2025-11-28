interface DocumentAnalysisResult {
  type: 'receipt' | 'id_card' | 'bank_statement' | 'contract' | 'unknown';
  confidence: number;
  extractedData: Record<string, unknown>;
  suggestions: string[];
  warnings: string[];
}

interface ReceiptData {
  merchantName: string;
  transactionId: string;
  amount: number;
  currency: string;
  date: string;
  payerPhone: string;
  payerName?: string;
  reference?: string;
}

interface IDCardData {
  fullName: string;
  nationalId: string;
  dateOfBirth: string;
  gender: string;
  district: string;
  sector: string;
  cell: string;
  expiryDate?: string;
  photoBase64?: string;
}

const GEMINI_VISION_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export class DocumentIntelligence {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeDocument(imageData: Uint8Array, mimeType: string): Promise<DocumentAnalysisResult> {
    const base64Image = this.arrayBufferToBase64(imageData);

    const response = await fetch(`${GEMINI_VISION_API}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `Analyze this document image and extract all relevant information. 
              
              Determine the document type from: receipt, id_card, bank_statement, contract, or unknown.
              
              For receipts, extract: merchant name, transaction ID, amount, currency, date, payer phone, payer name, reference. 
              For ID cards (Rwandan National ID), extract: full name, national ID number, date of birth, gender, district, sector, cell. 
              For bank statements, extract: account holder, account number, statement period, transactions list.
              
              Return a JSON object with:
              {
                "type": "document_type",
                "confidence": 0.0-1.0,
                "extractedData": { ... },
                "suggestions": ["suggestion1", "suggestion2"],
                "warnings": ["warning1", "warning2"]
              }
              
              Be thorough and accurate. Flag any suspicious or unclear information in warnings.`
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini Vision API error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('No response from Gemini Vision');
    }

    return JSON.parse(text) as DocumentAnalysisResult;
  }

  async scanMoMoReceipt(imageData: Uint8Array): Promise<ReceiptData> {
    const base64Image = this.arrayBufferToBase64(imageData);

    const response = await fetch(`${GEMINI_VISION_API}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `This is a Mobile Money (MoMo) receipt from Rwanda. Extract the following information:
              
              1. Transaction ID (usually starts with letters followed by numbers)
              2. Amount in RWF
              3. Sender/Payer phone number (format: 078XXXXXXX or +250XXXXXXXX)
              4. Sender/Payer name
              5. Transaction date and time
              6. Reference code if any
              7. Recipient information
              
              Return a JSON object:
              {
                "transactionId": "string",
                "amount": number,
                "currency": "RWF",
                "payerPhone": "string (E.164 format)",
                "payerName": "string",
                "date": "ISO 8601 string",
                "reference": "string or null",
                "merchantName": "string",
                "confidence": 0.0-1.0
              }
              
              If any field is unclear, use null. Phone numbers should be normalized to +250 format.`
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
        },
      }),
    });

    const result = await response.json();
    return JSON.parse(result.candidates[0].content.parts[0].text);
  }

  async scanNationalID(imageData: Uint8Array): Promise<IDCardData> {
    const base64Image = this.arrayBufferToBase64(imageData);

    const response = await fetch(`${GEMINI_VISION_API}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `This is a Rwandan National ID card. Extract:
              
              1. Full name (IZINA RYUZUYE)
              2. National ID number (16 digits, format: 1 1990 8 0123456 0 12)
              3. Date of birth
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
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
        },
      }),
    });

    const result = await response.json();
    return JSON.parse(result.candidates[0].content.parts[0].text);
  }

  async batchAnalyze(files: { data: Uint8Array; mimeType: string; name: string }[]): Promise<Map<string, DocumentAnalysisResult>> {
    const results = new Map<string, DocumentAnalysisResult>();
    
    const concurrency = 3;
    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(async (file) => {
          try {
            const result = await this.analyzeDocument(file.data, file.mimeType);
            return { name: file.name, result };
          } catch (error) {
            return { 
              name: file.name, 
              result: { 
                type: 'unknown' as const, 
                confidence: 0, 
                extractedData: {}, 
                suggestions: [], 
                warnings: [`Error: ${error}`] 
              } 
            };
          }
        })
      );
      
      batchResults.forEach(({ name, result }) => {
        results.set(name, result);
      });
    }

    return results;
  }

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
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}
