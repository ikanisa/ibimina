// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Meta WhatsApp Business API credentials
const META_WHATSAPP_ACCESS_TOKEN = Deno.env.get("META_WHATSAPP_ACCESS_TOKEN");
const META_WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("META_WHATSAPP_PHONE_NUMBER_ID");
const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_MINUTES = 15;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Generate a random 6-digit OTP
 */
function generateOTP(): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

/**
 * Hash OTP for secure storage
 */
async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Validate Rwanda phone number format
 */
function validatePhoneNumber(phone: string): boolean {
  // Expected format: +250XXXXXXXXX (12 digits total)
  return /^\+250[7][0-9]{8}$/.test(phone);
}

/**
 * Check rate limiting
 */
async function checkRateLimit(supabase: any, phoneNumber: string): Promise<{ allowed: boolean; message?: string }> {
  const cutoff = new Date(Date.now() - RATE_LIMIT_MINUTES * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from("auth_otp_codes")
    .select("id")
    .eq("phone_number", phoneNumber)
    .gte("created_at", cutoff);

  if (error) {
    console.error("Rate limit check error:", error);
    return { allowed: true }; // Fail open
  }

  if (data && data.length >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      message: `Too many requests. Please try again in ${RATE_LIMIT_MINUTES} minutes.`,
    };
  }

  return { allowed: true };
}

/**
 * Send WhatsApp OTP via Meta WhatsApp Business API using template
 */
async function sendWhatsAppOTP(phoneNumber: string, otpCode: string): Promise<{ success: boolean; error?: string }> {
  if (!META_WHATSAPP_ACCESS_TOKEN || !META_WHATSAPP_PHONE_NUMBER_ID) {
    return { success: false, error: "WhatsApp not configured" };
  }

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${META_WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${META_WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "template",
          template: {
            name: "otp",
            language: {
              code: "en_US"
            },
            components: [
              {
                type: "body",
                parameters: [
                  {
                    type: "text",
                    text: otpCode
                  }
                ]
              }
            ]
          }
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("WhatsApp API error:", error);
      return { success: false, error: "Failed to send WhatsApp message" };
    }

    const result = await response.json();
    console.log("WhatsApp message sent:", result.messages?.[0]?.id);
    return { success: true };
  } catch (error: any) {
    console.error("WhatsApp exception:", error);
    return { success: false, error: error.message || "Network error" };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body
    const { phoneNumber } = await req.json();

    // Validate phone number
    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      return new Response(
        JSON.stringify({ error: "Invalid Rwanda phone number format. Expected: +250XXXXXXXXX" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limiting
    const rateLimitCheck = await checkRateLimit(supabase, phoneNumber);
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({ error: rateLimitCheck.message }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate OTP
    const otpCode = generateOTP();
    const otpHash = await hashOTP(otpCode);

    // Calculate expiry
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    // Store OTP in database
    const { error: dbError } = await supabase
      .from("auth_otp_codes")
      .insert({
        phone_number: phoneNumber,
        otp_code_hash: otpHash,
        expires_at: expiresAt,
        attempts: 0,
        verified: false,
      });

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to store OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send WhatsApp message via Meta WhatsApp Business API
    const sendResult = await sendWhatsAppOTP(phoneNumber, otpCode);

    if (!sendResult.success) {
      // Delete the OTP record if sending failed
      await supabase
        .from("auth_otp_codes")
        .delete()
        .eq("phone_number", phoneNumber)
        .eq("otp_code_hash", otpHash);

      return new Response(
        JSON.stringify({ error: sendResult.error || "Failed to send OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Success
    console.log(`OTP sent to ${phoneNumber}`);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
