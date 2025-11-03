import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  phoneNumber: string;
}

interface RateLimitResponse {
  allowed: boolean;
  reason?: string;
  attempts?: number;
  maxAttempts?: number;
  blockedUntil?: string;
  waitSeconds?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const { phoneNumber }: SendOTPRequest = await req.json();

    // Validate phone number (Rwanda format: +250XXXXXXXXX)
    const phoneRegex = /^\+250[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "invalid_phone",
          message: "Please enter a valid Rwanda phone number (+250...)",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check rate limits
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .rpc("check_otp_rate_limit", { p_phone_number: phoneNumber });

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
      throw new Error("Failed to check rate limits");
    }

    const rateLimit = rateLimitData as RateLimitResponse;
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: rateLimit.reason,
          message:
            rateLimit.reason === "blocked"
              ? `Too many attempts. Please try again in ${Math.ceil((rateLimit.waitSeconds || 0) / 60)} minutes.`
              : "Maximum attempts reached. Please try again later.",
          waitSeconds: rateLimit.waitSeconds,
          blockedUntil: rateLimit.blockedUntil,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP for storage
    const encoder = new TextEncoder();
    const data = encoder.encode(otpCode);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const otpHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join(
      "",
    );

    // Store hashed OTP in database
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const { error: insertError } = await supabase
      .from("auth_otp_codes")
      .insert({
        phone_number: phoneNumber,
        otp_code_hash: otpHash,
        expires_at: expiresAt.toISOString(),
        ip_address: req.headers.get("x-forwarded-for"),
        user_agent: req.headers.get("user-agent"),
      });

    if (insertError) {
      console.error("Insert OTP error:", insertError);
      throw new Error("Failed to store OTP");
    }

    // Send OTP via WhatsApp (Meta Business API)
    const sendResult = await sendViaMetaWhatsApp(phoneNumber, otpCode);

    if (!sendResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "send_failed",
          message: "Failed to send OTP. Please try again.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP sent successfully",
        expiresIn: 300, // 5 minutes in seconds
        attempts: rateLimit.attempts,
        maxAttempts: rateLimit.maxAttempts,
        provider: sendResult.provider,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Send OTP error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "internal_error",
        message: "An error occurred. Please try again.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Send OTP via Meta WhatsApp Business API
 * Uses the authentication OTP template configured in Meta Business Manager
 */
async function sendViaMetaWhatsApp(
  phoneNumber: string,
  otpCode: string,
): Promise<{ success: boolean; provider: string }> {
  const accessToken = Deno.env.get("META_WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("META_WHATSAPP_PHONE_NUMBER_ID");

  if (!accessToken || !phoneNumberId) {
    console.error("Missing Meta WhatsApp credentials");
    // Fall back to dev mode in development
    if (Deno.env.get("APP_ENV") === "development") {
      console.log(`[DEV MODE] OTP for ${phoneNumber}: ${otpCode}`);
      return { success: true, provider: "dev" };
    }
    return { success: false, provider: "meta" };
  }

  // Use template message (OTP template must be pre-approved in Meta)
  const payload = {
    messaging_product: "whatsapp",
    to: phoneNumber.replace("+", ""), // Remove + sign
    type: "template",
    template: {
      name: "authentication", // Your template name in Meta
      language: {
        code: "en_US",
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: otpCode,
            },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: 0,
          parameters: [
            {
              type: "text",
              text: otpCode,
            },
          ],
        },
      ],
    },
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Meta WhatsApp error:", error);
      return { success: false, provider: "meta" };
    }

    const result = await response.json();
    console.log("WhatsApp OTP sent successfully:", result);
    return { success: true, provider: "meta" };
  } catch (error) {
    console.error("Meta WhatsApp send error:", error);
    return { success: false, provider: "meta" };
  }
}
