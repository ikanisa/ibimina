// TapMoMo Transaction Reconciliation Edge Function
// Deno runtime for Supabase Edge Functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReconcileRequest {
  transaction_id: string;
  merchant_id: string;
  amount: number;
  status: "settled" | "failed";
  payer_hint?: string;
  notes?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Parse request body
    const body: ReconcileRequest = await req.json();

    // Validate required fields
    if (!body.transaction_id || !body.merchant_id || !body.status) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify merchant exists and user has access
    const { data: merchant, error: merchantError } = await supabaseClient
      .from("merchants")
      .select("id")
      .eq("id", body.merchant_id)
      .single();

    if (merchantError || !merchant) {
      return new Response(JSON.stringify({ error: "Merchant not found or access denied" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update or insert transaction
    const { data: transaction, error: txError } = await supabaseClient
      .from("transactions")
      .upsert({
        id: body.transaction_id,
        merchant_id: body.merchant_id,
        amount: body.amount,
        status: body.status,
        payer_hint: body.payer_hint,
        notes: body.notes,
      })
      .select()
      .single();

    if (txError) {
      console.error("Transaction upsert error:", txError);
      return new Response(JSON.stringify({ error: "Failed to reconcile transaction" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Reconcile error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
