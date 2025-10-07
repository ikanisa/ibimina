// Deno edge function for parsing MoMo SMS messages

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmsParseRequest {
  rawText: string;
  receivedAt: string;
  vendorMeta?: any;
}

interface ParsedTransaction {
  msisdn: string;
  amount: number;
  txn_id: string;
  timestamp: string;
  payer_name?: string;
  reference?: string;
  confidence: number;
}

// MTN Rwanda MoMo SMS patterns (deterministic regex)
const MTN_PATTERNS = [
  // Pattern: "You have received RWF 20,000 from 0788123456 (UWIZEYE Marie). Ref: NYA.GAS.TWIZ.001. Balance: RWF 50,000. Txn ID: MTN123456789"
  /You have received RWF ([0-9,]+) from (\d{10}) \(([^)]+)\)\. Ref: ([A-Z0-9.]+)\. Balance: RWF [0-9,]+\. Txn ID: ([A-Z0-9]+)/i,
  
  // Pattern: "Received RWF 20000 from +250788123456. Ref: NYA.GAS.TWIZ.001. ID: MTN123456789"
  /Received RWF ([0-9,]+) from (\+?250\d{9})\. Ref: ([A-Z0-9.]+)\. ID: ([A-Z0-9]+)/i,
  
  // Pattern: "RWF 20000 received from 0788123456. Reference: NYA.GAS.TWIZ.001. Transaction: MTN123456789"
  /RWF ([0-9,]+) received from (\d{10})\. Reference: ([A-Z0-9.]+)\. Transaction: ([A-Z0-9]+)/i,
];

function parseWithRegex(rawText: string): ParsedTransaction | null {
  for (const pattern of MTN_PATTERNS) {
    const match = rawText.match(pattern);
    if (match) {
      const amount = parseInt(match[1].replace(/,/g, ''));
      const msisdn = match[2].startsWith('+') ? match[2] : `+250${match[2].substring(1)}`;
      const reference = match[3] || match[4];
      const txnId = match[4] || match[5];
      
      // Extract payer name if available (from first pattern)
      const payerMatch = rawText.match(/\(([^)]+)\)/);
      const payerName = payerMatch ? payerMatch[1] : undefined;

      return {
        msisdn,
        amount,
        txn_id: txnId,
        timestamp: new Date().toISOString(),
        payer_name: payerName,
        reference,
        confidence: 0.95 // High confidence for regex matches
      };
    }
  }
  return null;
}

async function parseWithAI(rawText: string): Promise<ParsedTransaction> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'You are an expert SMS parser for MoMo transactions. Extract transaction details and return ONLY valid JSON with no additional text.'
        },
        {
          role: 'user',
          content: `Parse this MoMo SMS and extract the transaction details. Return ONLY a JSON object with these exact fields:
{
  "msisdn": "phone number in E.164 format (+250...)",
  "amount": number (integer, no commas),
  "txn_id": "transaction ID string",
  "timestamp": "ISO8601 timestamp",
  "payer_name": "name if available, else null",
  "reference": "reference code if available, else null",
  "confidence": number between 0 and 1
}

SMS text:
${rawText}

Return ONLY the JSON, no markdown, no explanation.`
        }
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('AI gateway error:', response.status, error);
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content in AI response');
  }

  // Clean up markdown if present
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.substring(7);
  }
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.substring(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.substring(0, jsonStr.length - 3);
  }

  const parsed = JSON.parse(jsonStr.trim());
  
  // Validate required fields
  if (!parsed.msisdn || !parsed.amount || !parsed.txn_id) {
    throw new Error('Missing required fields in AI response');
  }

  return parsed;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawText, receivedAt, vendorMeta }: SmsParseRequest = await req.json();

    console.log('Parsing SMS:', { rawText, receivedAt });

    // Try regex parsing first
    let parsed = parseWithRegex(rawText);
    let parseSource = 'REGEX';

    // If regex fails or confidence too low, use AI
    if (!parsed || parsed.confidence < 0.9) {
      console.log('Regex failed or low confidence, trying AI parsing...');
      parsed = await parseWithAI(rawText);
      parseSource = 'AI';
    }

    console.log('Parse successful:', { parseSource, confidence: parsed.confidence });

    return new Response(
      JSON.stringify({
        success: true,
        parsed,
        parseSource,
        vendorMeta
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Parse error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
