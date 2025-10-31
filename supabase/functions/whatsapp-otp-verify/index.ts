/**
 * WhatsApp OTP Verify Edge Function
 *
 * Verifies OTP codes and creates/authenticates member accounts
 *
 * Security features:
 * - Max 3 attempts per OTP
 * - Automatic OTP consumption after successful verification
 * - Rate limiting on verification attempts
 * - Audit logging
 * - Automatic user creation if not exists
 */

import { createServiceClient } from "../_shared/mod.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  phone_number: string;
  code: string;
}

interface VerifyOTPResponse {
  success: boolean;
  message: string;
  session?: {
    access_token: string;
    refresh_token: string;
    user: {
      id: string;
      phone: string;
    };
  };
  attempts_remaining?: number;
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body: VerifyOTPRequest = await req.json();
    const { phone_number, code } = body;

    if (!phone_number || !code) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Phone number and code are required",
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

    // Rate limiting: max 10 verification attempts per phone per hour
    const rateLimitOk = await enforceRateLimit(supabase, `whatsapp_verify:${normalizedPhone}`, {
      maxHits: 10,
      windowSeconds: 3600,
    });

    if (!rateLimitOk) {
      await writeAuditLog(supabase, {
        event: "whatsapp_otp.verify_rate_limited",
        actor: null,
        entity: "whatsapp_otp",
        entity_id: normalizedPhone,
        metadata: { phone: normalizedPhone },
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: "Too many verification attempts. Please try again later.",
        } satisfies VerifyOTPResponse),
        {
          status: 429,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    // Get the most recent unconsumed OTP for this phone number
    const { data: otpRecord, error: otpError } = await supabase
      .schema("app")
      .from("whatsapp_otp_codes")
      .select("*")
      .eq("phone_number", normalizedPhone)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpRecord) {
      await writeAuditLog(supabase, {
        event: "whatsapp_otp.verify_no_code",
        actor: null,
        entity: "whatsapp_otp",
        entity_id: normalizedPhone,
        metadata: { phone: normalizedPhone },
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: "No active OTP found. Please request a new code.",
        } satisfies VerifyOTPResponse),
        {
          status: 404,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    // Check if OTP is expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      await writeAuditLog(supabase, {
        event: "whatsapp_otp.verify_expired",
        actor: null,
        entity: "whatsapp_otp",
        entity_id: normalizedPhone,
        metadata: { phone: normalizedPhone },
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: "OTP has expired. Please request a new code.",
        } satisfies VerifyOTPResponse),
        {
          status: 401,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    // Check max attempts (3)
    if (otpRecord.attempts >= 3) {
      await writeAuditLog(supabase, {
        event: "whatsapp_otp.verify_max_attempts",
        actor: null,
        entity: "whatsapp_otp",
        entity_id: normalizedPhone,
        metadata: { phone: normalizedPhone },
      });

      // Mark OTP as consumed (invalid)
      await supabase
        .schema("app")
        .from("whatsapp_otp_codes")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", otpRecord.id);

      return new Response(
        JSON.stringify({
          success: false,
          message: "Maximum verification attempts exceeded. Please request a new code.",
          attempts_remaining: 0,
        } satisfies VerifyOTPResponse),
        {
          status: 401,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    // Verify OTP code
    const isValid = await bcrypt.compare(code, otpRecord.code_hash);

    // Increment attempts
    await supabase
      .schema("app")
      .from("whatsapp_otp_codes")
      .update({ attempts: otpRecord.attempts + 1 })
      .eq("id", otpRecord.id);

    if (!isValid) {
      const attemptsRemaining = 3 - (otpRecord.attempts + 1);

      await writeAuditLog(supabase, {
        event: "whatsapp_otp.verify_invalid",
        actor: null,
        entity: "whatsapp_otp",
        entity_id: normalizedPhone,
        metadata: { phone: normalizedPhone, attempts_remaining: attemptsRemaining },
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: `Invalid OTP code. ${attemptsRemaining} attempt(s) remaining.`,
          attempts_remaining: attemptsRemaining,
        } satisfies VerifyOTPResponse),
        {
          status: 401,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    // OTP is valid - mark as consumed
    await supabase
      .schema("app")
      .from("whatsapp_otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", otpRecord.id);

    // Check if user exists with this phone number
    let userId: string;
    let isNewUser = false;

    const { data: existingProfile } = await supabase
      .from("members_app_profiles")
      .select("user_id")
      .eq("whatsapp_msisdn", normalizedPhone)
      .maybeSingle();

    if (existingProfile) {
      userId = existingProfile.user_id;

      // Update verification status and last login
      await supabase
        .from("members_app_profiles")
        .update({
          whatsapp_verified: true,
          whatsapp_verified_at: new Date().toISOString(),
          last_login_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    } else {
      // Create new user account
      const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
        phone: normalizedPhone,
        phone_confirm: true,
        app_metadata: { role: "member" },
      });

      if (userError || !newUser.user) {
        console.error("whatsapp_otp.user_creation_failed", { error: userError });
        return new Response(
          JSON.stringify({
            success: false,
            message: "Failed to create user account",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "content-type": "application/json" },
          }
        );
      }

      userId = newUser.user.id;
      isNewUser = true;

      // Create member profile
      await supabase.from("members_app_profiles").insert({
        user_id: userId,
        whatsapp_msisdn: normalizedPhone,
        momo_msisdn: normalizedPhone, // Default to same number
        whatsapp_verified: true,
        whatsapp_verified_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      });
    }

    // Generate session token
    const { data: session, error: sessionError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: `${normalizedPhone.replace("+", "")}@phone.sacco.rw`, // Fake email for phone users
      options: {
        redirectTo: "/",
      },
    });

    if (sessionError || !session) {
      console.error("whatsapp_otp.session_creation_failed", { error: sessionError });
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to create session",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    // Log successful verification
    await writeAuditLog(supabase, {
      event: isNewUser ? "whatsapp_otp.new_user_created" : "whatsapp_otp.verify_success",
      actor: userId,
      entity: "whatsapp_otp",
      entity_id: normalizedPhone,
      metadata: { phone: normalizedPhone, user_id: userId },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP verified successfully",
        session: {
          access_token: session.properties.action_link,
          refresh_token: session.properties.hashed_token,
          user: {
            id: userId,
            phone: normalizedPhone,
          },
        },
      } satisfies VerifyOTPResponse),
      {
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/json" },
      }
    );
  } catch (error) {
    console.error("whatsapp_otp.verify_unexpected_error", { error });
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
