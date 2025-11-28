import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text?: string;
      inline_data?: {
        mime_type: string;
        data: string;
      };
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify API key is configured
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limiting
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .from('api_rate_limits')
      .select('request_count, window_start')
      .eq('user_id', user.id)
      .eq('endpoint', 'gemini-proxy')
      .maybeSingle();

    if (!rateLimitError && rateLimitData) {
      const windowStart = new Date(rateLimitData.window_start);
      const now = new Date();
      const hoursDiff = (now.getTime() - windowStart.getTime()) / (1000 * 60 * 60);

      // 100 requests per hour limit
      if (hoursDiff < 1 && rateLimitData.request_count >= 100) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil((1 - hoursDiff) * 3600)
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Retry-After': String(Math.ceil((1 - hoursDiff) * 3600))
            } 
          }
        );
      }
    }

    // Parse and validate request body
    const body: GeminiRequest = await req.json();
    
    if (!body.contents || !Array.isArray(body.contents)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: missing or invalid contents' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate payload size (max 10MB for images)
    const requestSize = JSON.stringify(body).length;
    if (requestSize > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Request too large: max 10MB' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Forward request to Gemini API
    const startTime = Date.now();
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const processingTime = Date.now() - startTime;

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'Gemini API error',
          status: geminiResponse.status,
          message: errorText
        }),
        { 
          status: geminiResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result = await geminiResponse.json();

    // Update rate limit counter
    const { error: upsertError } = await supabase
      .from('api_rate_limits')
      .upsert({
        user_id: user.id,
        endpoint: 'gemini-proxy',
        request_count: rateLimitData ? rateLimitData.request_count + 1 : 1,
        window_start: rateLimitData?.window_start || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,endpoint'
      });

    if (upsertError) {
      console.error('Failed to update rate limit:', upsertError);
    }

    // Return successful response with processing time header
    return new Response(
      JSON.stringify(result),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Processing-Time-Ms': String(processingTime)
        },
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
