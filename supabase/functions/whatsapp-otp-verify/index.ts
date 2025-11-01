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

import { createServiceClient, getForwardedIp, requireEnv } from "../_shared/mod.ts";
import { enforceIpRateLimit, enforceRateLimit } from "../_shared/rate-limit.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { signAuthJwt, type AuthJwtClaims } from "../../../apps/platform-api/src/lib/jwt.ts";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  phone_number: string;
  code: string;
  device_id?: string;
  device_fingerprint?: string;
  device_fingerprint_hash?: string;
  user_agent?: string;
  user_agent_hash?: string;
}

interface VerifyOTPResponse {
  success: boolean;
  message: string;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    token_type?: string;
    auth_token?: string;
    auth_token_expires_at?: string;
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

interface ExchangeSessionResult {
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  tokenType: string | null;
}

const extractTokensFromUrl = (url: URL): ExchangeSessionResult => {
  const hashParams = url.hash ? new URLSearchParams(url.hash.slice(1)) : null;
  const searchParams = url.search ? new URLSearchParams(url.search.slice(1)) : null;

  const params =
    hashParams && hashParams.has("access_token")
      ? hashParams
      : searchParams && searchParams.has("access_token")
        ? searchParams
        : (hashParams ?? searchParams);

  const accessToken = params?.get("access_token") ?? null;
  const refreshToken = params?.get("refresh_token") ?? null;
  const expiresInValue = params?.get("expires_in") ?? null;
  const tokenType = params?.get("token_type") ?? null;
  const parsedExpiresIn = expiresInValue ? Number.parseInt(expiresInValue, 10) : Number.NaN;

  return {
    accessToken,
    refreshToken,
    expiresIn: Number.isNaN(parsedExpiresIn) ? null : parsedExpiresIn,
    tokenType,
  };
};

const exchangeMagicLinkForSession = async (actionLink: string): Promise<ExchangeSessionResult> => {
  let currentUrl = actionLink;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(currentUrl, { redirect: "manual" });
    const locationHeader = response.headers.get("location");

    const targetUrl = locationHeader ? new URL(locationHeader, currentUrl) : new URL(currentUrl);

    const tokens = extractTokensFromUrl(targetUrl);

    if (tokens.accessToken && tokens.refreshToken) {
      return tokens;
    }

    if (!locationHeader) {
      break;
    }

    currentUrl = targetUrl.toString();
  }

  return {
    accessToken: null,
    refreshToken: null,
    expiresIn: null,
    tokenType: null,
  };
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body: VerifyOTPRequest = await req.json();
    const { phone_number, code } = body;
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
    const clientIp = getForwardedIp(req.headers);

    const recordEvent = async (
      eventType:
        | "verify_success"
        | "verify_invalid"
        | "verify_throttled"
        | "verify_expired"
        | "verify_max_attempts",
      attemptsRemaining?: number | null,
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
        attempts_remaining: attemptsRemaining ?? null,
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

    // Rate limiting: max 30 verification attempts per IP per hour
    const ipRateLimitOk = await enforceIpRateLimit(supabase, clientIp, "whatsapp_otp_verify", {
      maxHits: 30,
      windowSeconds: 3600,
    });

    if (!ipRateLimitOk) {
      await recordEvent("verify_throttled", null, { reason: "ip_rate_limit" });
      await writeAuditLog(supabase, {
        actorId: null,
        action: "whatsapp_otp.verify.ip_rate_limited",
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
          message: "Too many verification attempts. Please try again later.",
        } satisfies VerifyOTPResponse),
        {
          status: 429,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    // Rate limiting: max 10 verification attempts per phone per hour
    const rateLimitOk = await enforceRateLimit(supabase, `whatsapp_verify:${normalizedPhone}`, {
      maxHits: 10,
      windowSeconds: 3600,
    });

    if (!rateLimitOk) {
      await recordEvent("verify_throttled", null, { reason: "phone_rate_limit" });
      await writeAuditLog(supabase, {
        actorId: null,
        action: "whatsapp_otp.verify.phone_rate_limited",
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
      const eventMetadata: Record<string, unknown> = {
        reason: otpError ? "lookup_error" : "no_active_code",
      };

      if (otpError) {
        eventMetadata.error = {
          message: otpError.message,
          code: otpError.code,
          details: otpError.details,
        };
      }

      await recordEvent("verify_invalid", null, eventMetadata);
      await writeAuditLog(supabase, {
        actorId: null,
        action: "whatsapp_otp.verify.no_active_code",
        entity: "whatsapp_otp",
        entityId: normalizedPhone,
        diff: {
          phone: normalizedPhone,
          ip: clientIp,
          device_id: deviceId,
          device_fingerprint: deviceFingerprint,
          error: otpError ? otpError.message : null,
        },
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
      await recordEvent("verify_expired");
      await writeAuditLog(supabase, {
        actorId: null,
        action: "whatsapp_otp.verify.expired",
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
      await recordEvent("verify_max_attempts", 0, { attempts: otpRecord.attempts });
      await writeAuditLog(supabase, {
        actorId: null,
        action: "whatsapp_otp.verify.max_attempts",
        entity: "whatsapp_otp",
        entityId: normalizedPhone,
        diff: {
          phone: normalizedPhone,
          ip: clientIp,
          device_id: deviceId,
          device_fingerprint: deviceFingerprint,
          attempts: otpRecord.attempts,
        },
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

      await recordEvent("verify_invalid", attemptsRemaining, {
        attempts_remaining: attemptsRemaining,
        attempts: otpRecord.attempts + 1,
      });
      await writeAuditLog(supabase, {
        actorId: null,
        action: "whatsapp_otp.verify.invalid_code",
        entity: "whatsapp_otp",
        entityId: normalizedPhone,
        diff: {
          phone: normalizedPhone,
          ip: clientIp,
          device_id: deviceId,
          device_fingerprint: deviceFingerprint,
          attempts_remaining: attemptsRemaining,
        },
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
    const supabaseUrl = requireEnv("SUPABASE_URL");

    const { data: session, error: sessionError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: `${normalizedPhone.replace("+", "")}@phone.sacco.rw`, // Fake email for phone users
      options: {
        redirectTo: `${supabaseUrl}/auth/v1/token-exchange`,
      },
    });

    if (sessionError || !session?.properties?.action_link) {
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

    const exchangedSession = await exchangeMagicLinkForSession(session.properties.action_link);

    if (!exchangedSession.accessToken || !exchangedSession.refreshToken) {
      console.error("whatsapp_otp.session_exchange_failed", {
        action_link: session.properties.action_link,
      });
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to exchange session tokens",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    const issuedAt = Math.floor(Date.now() / 1000);
    const authTokenExpiresAt = issuedAt + 60 * 60;
    const tokenClaims: AuthJwtClaims = {
      sub: userId,
      auth: "member",
      exp: authTokenExpiresAt,
      phone: normalizedPhone,
      factor: "whatsapp",
    };

    if (deviceId) {
      tokenClaims.device_id = deviceId;
    }

    if (deviceFingerprint) {
      tokenClaims.device_fingerprint = deviceFingerprint;
    }

    const authToken = await signAuthJwt(tokenClaims);

    await recordEvent("verify_success", null, {
      user_id: userId,
      is_new_user: isNewUser,
    });

    await writeAuditLog(supabase, {
      actorId: userId,
      action: isNewUser ? "whatsapp_otp.verify.new_user" : "whatsapp_otp.verify.success",
      entity: "whatsapp_otp",
      entityId: normalizedPhone,
      diff: {
        phone: normalizedPhone,
        user_id: userId,
        ip: clientIp,
        device_id: deviceId,
        device_fingerprint: deviceFingerprint,
        new_user: isNewUser,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP verified successfully",
        session: {
          access_token: exchangedSession.accessToken,
          refresh_token: exchangedSession.refreshToken,
          expires_in: exchangedSession.expiresIn ?? undefined,
          token_type: exchangedSession.tokenType ?? undefined,
          auth_token: authToken,
          auth_token_expires_at: new Date(authTokenExpiresAt * 1000).toISOString(),
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
