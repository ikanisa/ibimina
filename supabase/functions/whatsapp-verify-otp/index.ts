// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MAX_VERIFICATION_ATTEMPTS = 3;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Hash OTP for comparison
 */
async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Validate OTP format
 */
function validateOTPFormat(otp: string): boolean {
  return /^[0-9]{6}$/.test(otp);
}

/**
 * Get or create user by phone number
 */
async function getOrCreateUser(supabase: any, phoneNumber: string): Promise<{ user?: any; error?: string }> {
  // Check if user exists
  const { data: existingUsers, error: queryError } = await supabase
    .from("users")
    .select("*")
    .eq("phone_number", phoneNumber)
    .limit(1);

  if (queryError) {
    console.error("User query error:", queryError);
    return { error: "Database error" };
  }

  if (existingUsers && existingUsers.length > 0) {
    return { user: existingUsers[0] };
  }

  // Create new user
  const newUser = {
    phone_number: phoneNumber,
    full_name: phoneNumber, // Temporary, user can update later
    email: `${phoneNumber.replace('+', '')}@ibimina.rw`, // Temporary email
    role: "CLIENT",
    status: "ACTIVE",
    created_at: new Date().toISOString(),
  };

  const { data: createdUser, error: createError } = await supabase
    .from("users")
    .insert(newUser)
    .select()
    .single();

  if (createError) {
    console.error("User creation error:", createError);
    return { error: "Failed to create user" };
  }

  return { user: createdUser };
}

/**
 * Create authentication session
 */
async function createSession(supabase: any, userId: string): Promise<{ session?: any; error?: string }> {
  try {
    // Create a session token (simplified - in production use JWT properly)
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    const session = {
      user_id: userId,
      access_token: sessionToken,
      refresh_token: crypto.randomUUID(),
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    };

    const { data: createdSession, error } = await supabase
      .from("auth_sessions")
      .insert(session)
      .select()
      .single();

    if (error) {
      console.error("Session creation error:", error);
      return { error: "Failed to create session" };
    }

    return { session: createdSession };
  } catch (error: any) {
    console.error("Session creation exception:", error);
    return { error: error.message || "Unknown error" };
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
    const { phoneNumber, otpCode } = await req.json();

    // Validate inputs
    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!otpCode || !validateOTPFormat(otpCode)) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP format. Expected 6 digits" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find most recent OTP for this phone number
    const { data: otpRecords, error: queryError } = await supabase
      .from("auth_otp_codes")
      .select("*")
      .eq("phone_number", phoneNumber)
      .eq("verified", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (queryError) {
      console.error("OTP query error:", queryError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!otpRecords || otpRecords.length === 0) {
      return new Response(
        JSON.stringify({ error: "No OTP found. Please request a new one." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const otpRecord = otpRecords[0];

    // Check if OTP is expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This code has expired. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check max attempts
    if (otpRecord.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      return new Response(
        JSON.stringify({ error: "Too many failed attempts. Please request a new code." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash the provided OTP and compare
    const otpHash = await hashOTP(otpCode);

    if (otpHash !== otpRecord.otp_code_hash) {
      // Increment attempts
      await supabase
        .from("auth_otp_codes")
        .update({ attempts: otpRecord.attempts + 1 })
        .eq("id", otpRecord.id);

      const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - otpRecord.attempts - 1;
      return new Response(
        JSON.stringify({
          error: `Incorrect code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // OTP is valid - mark as verified
    await supabase
      .from("auth_otp_codes")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    // Get or create user
    const userResult = await getOrCreateUser(supabase, phoneNumber);
    if (userResult.error || !userResult.user) {
      return new Response(
        JSON.stringify({ error: userResult.error || "Failed to get user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create session
    const sessionResult = await createSession(supabase, userResult.user.id);
    if (sessionResult.error || !sessionResult.session) {
      return new Response(
        JSON.stringify({ error: sessionResult.error || "Failed to create session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return user and session
    console.log(`User authenticated: ${phoneNumber}`);
    return new Response(
      JSON.stringify({
        success: true,
        user: userResult.user,
        session: sessionResult.session,
      }),
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
