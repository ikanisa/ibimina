import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  phoneNumber: string;
  otpCode: string;
  fullName?: string; // For new user registration
}

interface VerifyOTPResponse {
  success: boolean;
  userId?: string;
  isNewUser?: boolean;
  phoneNumber?: string;
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
    const { phoneNumber, otpCode, fullName }: VerifyOTPRequest = await req
      .json();

    // Validate inputs
    const phoneRegex = /^\+250[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "invalid_phone",
          message: "Invalid phone number format",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!otpCode || otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "invalid_otp",
          message: "OTP must be 6 digits",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify OTP using database function
    const { data: verifyData, error: verifyError } = await supabase
      .rpc("verify_otp_code", {
        p_phone_number: phoneNumber,
        p_otp_code: otpCode,
      });

    if (verifyError) {
      console.error("Verify OTP error:", verifyError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "verification_failed",
          message: "Failed to verify OTP",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const verifyResult = verifyData as VerifyOTPResponse;

    if (!verifyResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "invalid_otp",
          message: "Invalid or expired OTP code",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If existing user, create session and return
    if (!verifyResult.isNewUser && verifyResult.userId) {
      // Get user from auth.users
      const { data: userData, error: userError } = await supabase.auth.admin
        .getUserById(verifyResult.userId);

      if (userError || !userData.user) {
        console.error("Get user error:", userError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "user_not_found",
            message: "User not found",
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Create auth session
      const { data: sessionData, error: sessionError } = await supabase.auth
        .admin
        .createSession({
          user_id: verifyResult.userId,
        });

      if (sessionError || !sessionData.session) {
        console.error("Create session error:", sessionError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "session_failed",
            message: "Failed to create session",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Return success with session
      return new Response(
        JSON.stringify({
          success: true,
          isNewUser: false,
          user: userData.user,
          session: sessionData.session,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // New user - create account
    if (verifyResult.isNewUser) {
      if (!fullName || fullName.trim().length < 2) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "missing_name",
            message: "Full name is required for new users",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Create auth user with phone as email (Supabase requires email)
      const email = `${phoneNumber.replace("+", "")}@ibimina.temp`;
      const randomPassword = crypto.randomUUID();

      const { data: newUserData, error: createUserError } = await supabase
        .auth.admin.createUser({
          email: email,
          password: randomPassword,
          email_confirm: true, // Auto-confirm since we verified phone
          phone: phoneNumber,
          phone_confirm: true,
          user_metadata: {
            full_name: fullName.trim(),
            phone_number: phoneNumber,
            auth_method: "whatsapp_otp",
          },
        });

      if (createUserError || !newUserData.user) {
        console.error("Create user error:", createUserError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "user_creation_failed",
            message: "Failed to create user account",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Update user_profiles with phone number
      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert({
          id: newUserData.user.id,
          full_name: fullName.trim(),
          phone_number: phoneNumber,
          created_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error("Profile update error:", profileError);
        // Don't fail the request, profile can be updated later
      }

      // Create default savings account
      const { error: accountError } = await supabase
        .from("accounts")
        .insert({
          user_id: newUserData.user.id,
          account_type: "savings",
          currency: "RWF",
          balance: 0,
          status: "active",
        });

      if (accountError) {
        console.error("Account creation error:", accountError);
        // Don't fail the request, account can be created later
      }

      // Create auth session
      const { data: sessionData, error: sessionError } = await supabase.auth
        .admin
        .createSession({
          user_id: newUserData.user.id,
        });

      if (sessionError || !sessionData.session) {
        console.error("Create session error:", sessionError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "session_failed",
            message: "User created but failed to create session",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Return success with session
      return new Response(
        JSON.stringify({
          success: true,
          isNewUser: true,
          user: newUserData.user,
          session: sessionData.session,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Should not reach here
    return new Response(
      JSON.stringify({
        success: false,
        error: "unknown_error",
        message: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
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
