/**
 * WhatsApp OTP Send Edge Function
 *
 * Generates and sends OTP codes via WhatsApp for member authentication
 *
 * Security features:
 * - Rate limiting (max 5 OTPs per phone per hour)
 * - Secure OTP generation (6 digits, cryptographically random)
 * - Hashed storage (bcrypt)
 * - Expiry time (5 minutes)
 * - Audit logging
 */

import { createServiceClient, requireEnv } from "../_shared/mod.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { serveWithObservability } from "../_shared/observability.ts";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers":
    "authorization, x-client-info, apikey, content-type, x-signature, x-timestamp",
};

const OTP_TTL_SEC = parseInt(Deno.env.get("OTP_TTL_SEC") ?? "300", 10);
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SEC = 3600;

interface SendOTPRequest {
  phone_number: string;
  device_id?: string;
  device_fingerprint?: string;
  device_fingerprint_hash?: string;
  user_agent?: string;
  user_agent_hash?: string;
}

interface SendOTPResponse {
  ok: boolean;
  ttl?: number;
  attempts?: number;
  error?: string;
  retry_after?: number;
}

/**
 * Generate a cryptographically secure 6-digit OTP
 */
export function generateOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const num = array[0] % 1000000;
  return num.toString().padStart(6, "0");
}

/**
 * Validate phone number format (Rwanda numbers)
 */
export function validatePhoneNumber(phone: string): boolean {
  // Accept formats: 078XXXXXXX, 250XXXXXXXXX, +250XXXXXXXXX
  const patterns = [/^07[2-9]\d{7}$/, /^2507[2-9]\d{7}$/, /^\+2507[2-9]\d{7}$/];
  return patterns.some((pattern) => pattern.test(phone));
}

/**
 * Normalize phone number to E.164 format
 */
export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.trim();
  if (cleaned.startsWith("+250")) return cleaned;
  if (cleaned.startsWith("250")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+250${cleaned.slice(1)}`;
  return cleaned;
}

export interface TemplatePayload {
  messaging_product: "whatsapp";
  to: string;
  type: "template";
  template: {
    name: string;
    language: { code: string };
    components: Array<{
      type: "body";
      parameters: Array<{ type: "text"; text: string }>;
    }>;
  };
}

export const buildTemplatePayload = (
  phoneNumber: string,
  code: string,
  templateName: string,
  templateLanguage: string
): TemplatePayload => ({
  messaging_product: "whatsapp",
  to: phoneNumber.replace("+", ""),
  type: "template",
  template: {
    name: templateName,
    language: { code: templateLanguage },
    components: [
      {
        type: "body",
        parameters: [
          {
            type: "text",
            text: code,
          },
        ],
      },
    ],
  },
});

export const calculateTtlSeconds = (expiresAt: string | Date, reference = new Date()): number => {
  const expiry = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  const diffMs = expiry.getTime() - reference.getTime();
  return diffMs > 0 ? Math.ceil(diffMs / 1000) : 0;
};

/**
 * Send WhatsApp message via Meta WhatsApp Business API
 */
async function sendWhatsAppOTP(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const accessToken = requireEnv("META_WABA_TOKEN");
  const phoneNumberId = requireEnv("META_WABA_PHONE_NUMBER_ID");
  const templateName = requireEnv("OTP_TEMPLATE_NAME");
  const templateLang = requireEnv("OTP_TEMPLATE_LANG");

  const apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
  const payload = buildTemplatePayload(phoneNumber, code, templateName, templateLang);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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

export const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body: SendOTPRequest = await req.json();
    const { phone_number } = body;
    const deviceId = typeof body.device_id === "string" ? body.device_id : null;
    const deviceFingerprint =
      typeof body.device_fingerprint === "string"
        ? body.device_fingerprint
        : typeof body.device_fingerprint_hash === "string"
          ? body.device_fingerprint_hash
          : null;
    const explicitUserAgent = typeof body.user_agent === "string" ? body.user_agent : null;
    const userAgent = explicitUserAgent ?? req.headers.get("user-agent") ?? null;
    const userAgentHash = typeof body.user_agent_hash === "string" ? body.user_agent_hash : null;

    const baseMetadata: Record<string, unknown> = {};
    if (userAgentHash) {
      baseMetadata.user_agent_hash = userAgentHash;
    }

    if (!phone_number) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Phone number is required",
        } satisfies SendOTPResponse),
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
          ok: false,
          error: "Invalid phone number format. Please use a valid Rwanda mobile number.",
        } satisfies SendOTPResponse),
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
    const clientIp = getForwardedIp(req.headers);

    const recordEvent = async (
      eventType: "send_success" | "send_throttled" | "send_failed",
      metadata?: Record<string, unknown>
    ) => {
      const metadataPayload = { ...baseMetadata };
      if (metadata) {
        Object.assign(metadataPayload, metadata);
      }
      const finalMetadata = Object.keys(metadataPayload).length > 0 ? metadataPayload : null;

      const { error: eventError } = await supabase.rpc("record_whatsapp_otp_event", {
        phone_number: normalizedPhone,
        event_type: eventType,
        attempts_remaining: null,
        ip_address: clientIp,
        device_fingerprint: deviceFingerprint,
        device_id: deviceId,
        user_agent: userAgent,
        metadata: finalMetadata,
      });

      if (eventError) {
        console.error("whatsapp_otp.event_log_failed", {
          error: eventError,
          eventType,
          phone: normalizedPhone,
        });
      }
    };

    // Rate limiting: max 30 OTPs per IP per hour
    const ipRateLimitOk = await enforceIpRateLimit(supabase, clientIp, "whatsapp_otp_send", {
      maxHits: 30,
      windowSeconds: 3600,
    });

    if (!ipRateLimitOk) {
      await recordEvent("send_throttled", { reason: "ip_rate_limit" });
      await writeAuditLog(supabase, {
        actorId: null,
        action: "whatsapp_otp.send.ip_rate_limited",
        entity: "whatsapp_otp",
        entityId: normalizedPhone,
        diff: {
          phone: normalizedPhone,
          ip: clientIp,
          device_id: deviceId,
          device_fingerprint: deviceFingerprint,
        },
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

    const now = new Date();

    // Check for existing active OTP to reuse TTL
    const { data: existingOtp } = await supabase
      .schema("app")
      .from("whatsapp_otp_codes")
      .select("id, expires_at, attempts")
      .eq("phone_number", normalizedPhone)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingOtp) {
      const remainingTtl = calculateTtlSeconds(existingOtp.expires_at, now);
      if (remainingTtl > 0) {
        return new Response(
          JSON.stringify({
            ok: true,
            ttl: remainingTtl,
            attempts: existingOtp.attempts ?? 0,
          } satisfies SendOTPResponse),
          {
            status: 200,
            headers: { ...corsHeaders, "content-type": "application/json" },
          }
        );
      }

      // Mark expired OTPs as consumed to avoid reuse
      await supabase
        .schema("app")
        .from("whatsapp_otp_codes")
        .update({ consumed_at: now.toISOString() })
        .eq("id", existingOtp.id);
    }

    // Rate limiting: max 5 OTPs per phone per hour
    const rateLimitOk = await enforceRateLimit(supabase, `whatsapp_otp:${normalizedPhone}`, {
      maxHits: RATE_LIMIT_MAX,
      windowSeconds: RATE_LIMIT_WINDOW_SEC,
    });

    if (!rateLimitOk) {
      await recordEvent("send_throttled", { reason: "phone_rate_limit" });
      await writeAuditLog(supabase, {
        actorId: null,
        action: "whatsapp_otp.send.phone_rate_limited",
        entity: "whatsapp_otp",
        entityId: normalizedPhone,
        diff: {
          phone: normalizedPhone,
          ip: clientIp,
          device_id: deviceId,
          device_fingerprint: deviceFingerprint,
        },
      });

      return new Response(
        JSON.stringify({
          ok: false,
          error: "Too many OTP requests. Please try again later.",
          retry_after: RATE_LIMIT_WINDOW_SEC,
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

    // Calculate expiry time
    const expiresAt = new Date(now.getTime() + OTP_TTL_SEC * 1000);

    // Store OTP in database
    const { data: insertedOtp, error: dbError } = await supabase
      .schema("app")
      .from("whatsapp_otp_codes")
      .insert({
        phone_number: normalizedPhone,
        code_hash: otpHash,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("whatsapp_otp.db_insert_failed", { error: dbError });
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Failed to generate OTP. Please try again.",
        } satisfies SendOTPResponse),
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
      await recordEvent("send_failed", { error: sendResult.error });
      await writeAuditLog(supabase, {
        actorId: null,
        action: "whatsapp_otp.send.failed",
        entity: "whatsapp_otp",
        entityId: normalizedPhone,
        diff: {
          phone: normalizedPhone,
          error: sendResult.error,
          ip: clientIp,
          device_id: deviceId,
          device_fingerprint: deviceFingerprint,
        },
      });

      return new Response(
        JSON.stringify({
          ok: false,
          error: "Failed to send OTP. Please try again.",
        } satisfies SendOTPResponse),
        {
          status: 500,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    // Log successful send
    await recordEvent("send_success");
    await writeAuditLog(supabase, {
      actorId: null,
      action: "whatsapp_otp.send.success",
      entity: "whatsapp_otp",
      entityId: normalizedPhone,
      diff: {
        phone: normalizedPhone,
        ip: clientIp,
        device_id: deviceId,
        device_fingerprint: deviceFingerprint,
      },
    });

    return new Response(
      JSON.stringify({
        ok: true,
        ttl: OTP_TTL_SEC,
        attempts: 0,
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
        ok: false,
        error: "An unexpected error occurred",
      } satisfies SendOTPResponse),
      {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      }
    );
  }
};

if (import.meta.main) {
  serveWithObservability("whatsapp-otp-send", handler);
}
