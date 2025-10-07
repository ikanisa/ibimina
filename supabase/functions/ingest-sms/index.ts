import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IngestRequest {
  rawText: string;
  receivedAt: string;
  vendorMeta?: any;
  saccoId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { rawText, receivedAt, vendorMeta, saccoId }: IngestRequest = await req.json();

    console.log('Ingesting SMS:', { length: rawText.length, receivedAt, saccoId });

    // Step 1: Store raw SMS
    const { data: smsRecord, error: smsError } = await supabase
      .from('sms_inbox')
      .insert({
        raw_text: rawText,
        received_at: receivedAt,
        vendor_meta: vendorMeta,
        sacco_id: saccoId,
        status: 'NEW',
      })
      .select()
      .single();

    if (smsError) {
      console.error('Error storing SMS:', smsError);
      throw smsError;
    }

    console.log('SMS stored:', smsRecord.id);

    // Step 2: Parse SMS using parse-sms function
    const parseResponse = await supabase.functions.invoke('parse-sms', {
      body: { rawText, receivedAt, vendorMeta }
    });

    if (parseResponse.error) {
      console.error('Parse function error:', parseResponse.error);
      
      // Update SMS status to FAILED
      await supabase
        .from('sms_inbox')
        .update({
          status: 'FAILED',
          error: parseResponse.error.message || 'Parse failed'
        })
        .eq('id', smsRecord.id);

      throw parseResponse.error;
    }

    const { parsed, parseSource } = parseResponse.data;

    console.log('SMS parsed:', { parseSource, confidence: parsed.confidence });

    // Step 3: Update SMS with parsed data
    await supabase
      .from('sms_inbox')
      .update({
        parsed_json: parsed,
        parse_source: parseSource,
        confidence: parsed.confidence,
        msisdn: parsed.msisdn,
        status: 'PARSED'
      })
      .eq('id', smsRecord.id);

    // Step 4: Map to SACCO/Ikimina/Member based on reference
    let mappedSaccoId = saccoId;
    let ikiminaId = null;
    let memberId = null;
    let paymentStatus = 'PENDING';

    if (parsed.reference) {
      // Parse reference: DISTRICT.SACCO.GROUP(.MEMBER)?
      const refParts = parsed.reference.split('.');
      
      if (refParts.length >= 3) {
        const groupCode = refParts[2];
        
        // Find Ikimina by code
        const { data: ikimina } = await supabase
          .from('ibimina')
          .select('id, sacco_id')
          .eq('code', groupCode)
          .eq('status', 'ACTIVE')
          .single();

        if (ikimina) {
          mappedSaccoId = ikimina.sacco_id;
          ikiminaId = ikimina.id;

          // If member code provided, find member
          if (refParts.length >= 4) {
            const memberCode = refParts[3];
            
            const { data: member } = await supabase
              .from('ikimina_members')
              .select('id')
              .eq('ikimina_id', ikimina.id)
              .eq('member_code', memberCode)
              .eq('status', 'ACTIVE')
              .single();

            if (member) {
              memberId = member.id;
              paymentStatus = 'POSTED'; // Auto-approve when fully matched
            } else {
              paymentStatus = 'UNALLOCATED'; // Group matched but not member
            }
          } else {
            paymentStatus = 'UNALLOCATED'; // No member code provided
          }
        }
      }
    }

    // Step 5: Create Payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        channel: 'SMS',
        sacco_id: mappedSaccoId || saccoId,
        ikimina_id: ikiminaId,
        member_id: memberId,
        msisdn: parsed.msisdn,
        amount: parsed.amount,
        currency: 'RWF',
        txn_id: parsed.txn_id,
        reference: parsed.reference,
        occurred_at: parsed.timestamp,
        status: paymentStatus,
        source_id: smsRecord.id,
        ai_version: parseSource === 'AI' ? 'gemini-2.5-flash' : null,
        confidence: parsed.confidence
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      throw paymentError;
    }

    console.log('Payment created:', { id: payment.id, status: paymentStatus });

    // Step 6: Update SMS status
    await supabase
      .from('sms_inbox')
      .update({ status: 'APPLIED' })
      .eq('id', smsRecord.id);

    return new Response(
      JSON.stringify({
        success: true,
        smsId: smsRecord.id,
        paymentId: payment.id,
        status: paymentStatus,
        parsed,
        parseSource
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Ingestion error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
