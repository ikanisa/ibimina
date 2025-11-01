/**
 * WhatsApp OTP Send Edge Function
 *
 * Generates and sends OTP codes via WhatsApp for member authentication
 *
 * Security features:
 * - Rate limiting (max 3 OTPs per phone per hour)
 * - Secure OTP generation (6 digits, cryptographically random)
 * - Hashed storage (bcrypt)
 * - Expiry time (5 minutes)
 * - Audit logging
 */

import { createServiceClient, requireEnv } from "../_shared/mod.ts";
import { validateHmacRequest } from "../_shared/auth.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers":
    "authorization, x-client-info, apikey, content-type, x-signature, x-timestamp",
};

interface SendOTPRequest {
  phone_number: string;
}

interface SendOTPResponse {
  success: boolean;
  message: string;
  expires_at?: string;
  retry_after?: number;
}

/**
 * Generate a cryptographically secure 6-digit OTP
 */
function generateOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const num = array[0] % 1000000;
  return num.toString().padStart(6, "0");
}

/**
 * Validate phone number format (Rwanda numbers)
 */
function validatePhoneNumber(phone: string): boolean {
  // Accept formats: 078XXXXXXX, 250XXXXXXXXX, +250XXXXXXXXX
  const patterns = [/^07[2-9]\d{7}$/, /^2507[2-9]\d{7}$/, /^\+2507[2-9]\d{7}$/];
  return patterns.some((pattern) => pattern.test(phone));
}

/**
 * Normalize phone number to E.164 format
 */
function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.trim();
  if (cleaned.startsWith("+250")) return cleaned;
  if (cleaned.startsWith("250")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+250${cleaned.slice(1)}`;
  return cleaned;
}

/**
 * Send WhatsApp message via Meta WhatsApp Business API
 */
async function sendWhatsAppOTP(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const accessToken = requireEnv("META_WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = requireEnv("META_WHATSAPP_PHONE_NUMBER_ID");

  const apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  const message = `Your SACCO+ verification code is: ${code}\n\nThis code expires in 5 minutes. Do not share this code with anyone.`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phoneNumber.replace("+", ""),
        type: "text",
        text: { body: message },
      }),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => "Unknown error");
      console.error("whatsapp_otp.send_failed", {
        status: response.status,
        error,
      });
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("whatsapp_otp.send_exception", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body: SendOTPRequest = await req.json();
    const { phone_number } = body;

    if (!phone_number) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Phone number is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    // Validate phone number format
    if (!validatePhoneNumber(phone_number)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid phone number format. Please use a valid Rwanda mobile number.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone_number);

    // Create Supabase client
    const supabase = createServiceClient();

    // Rate limiting: max 3 OTPs per phone per hour
    const rateLimitOk = await enforceRateLimit(supabase, `whatsapp_otp:${normalizedPhone}`, {
      maxHits: 3,
      windowSeconds: 3600,
    });

    if (!rateLimitOk) {
      await writeAuditLog(supabase, {
        event: "whatsapp_otp.rate_limited",
        actor: null,
        entity: "whatsapp_otp",
        entity_id: normalizedPhone,
        metadata: { phone: normalizedPhone },
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: "Too many OTP requests. Please try again later.",
          retry_after: 3600,
        } satisfies SendOTPResponse),
        {
          status: 429,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    // Generate OTP
    const otp = generateOTP();

    // Hash OTP for storage
    const otpHash = await bcrypt.hash(otp);

    // Calculate expiry time (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Store OTP in database
    const { data: insertedOtp, error: dbError } = await supabase
      .schema("app")
      .from("whatsapp_otp_codes")
      .insert({
        phone_number: normalizedPhone,
        code_hash: otpHash,
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("whatsapp_otp.db_insert_failed", { error: dbError });
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to generate OTP. Please try again.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    // Send OTP via WhatsApp
    const sendResult = await sendWhatsAppOTP(normalizedPhone, otp);

    if (!sendResult.success) {
      if (insertedOtp?.id) {
        const { error: cleanupError } = await supabase
          .schema("app")
          .from("whatsapp_otp_codes")
          .delete()
          .eq("id", insertedOtp.id);

        if (cleanupError) {
          console.error("whatsapp_otp.cleanup_failed", {
            error: cleanupError,
            phone: normalizedPhone,
          });
        }
      }

      // Log failure but don't expose details to client
      await writeAuditLog(supabase, {
        event: "whatsapp_otp.send_failed",
        actor: null,
        entity: "whatsapp_otp",
        entity_id: normalizedPhone,
        metadata: { phone: normalizedPhone, error: sendResult.error },
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to send OTP. Please try again.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    // Log successful send
    await writeAuditLog(supabase, {
      event: "whatsapp_otp.sent",
      actor: null,
      entity: "whatsapp_otp",
      entity_id: normalizedPhone,
      metadata: { phone: normalizedPhone },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP sent successfully",
        expires_at: expiresAt.toISOString(),
      } satisfies SendOTPResponse),
      {
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/json" },
      }
    );
  } catch (error) {
    console.error("whatsapp_otp.unexpected_error", { error });
    return new Response(
      JSON.stringify({
        success: false,
        message: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      }
    );
  }
});
