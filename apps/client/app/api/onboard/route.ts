/**
 * Onboarding API Route Handler
 *
 * POST /api/onboard
 *
 * This route handles member onboarding by saving user profile data to the
 * members_app_profiles table in Supabase.
 *
 * Request body:
 * - whatsapp_msisdn: string (required) - WhatsApp phone number in E.164 format
 * - momo_msisdn: string (required) - Mobile Money phone number in E.164 format
 * - lang: string (optional) - Preferred language code (defaults to 'en')
 *
 * Response:
 * - 201: Profile created successfully
 * - 400: Invalid request body or validation error
 * - 401: User not authenticated
 * - 409: Profile already exists for this user
 * - 500: Server error during profile creation
 *
 * Security:
 * - Requires valid Supabase session (authenticated user)
 * - Row Level Security (RLS) policies enforce user can only create their own profile
 * - Input validation using Zod schema
 *
 * Database:
 * - Table: public.members_app_profiles
 * - RLS Policy: "Members can insert own profile"
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

/**
 * Zod schema for onboarding request validation
 * Ensures required fields are present and properly formatted
 */
const onboardingSchema = z.object({
  whatsapp_msisdn: z
    .string()
    .min(1, "WhatsApp number is required")
    .regex(/^\+250[0-9]{9}$/, "Invalid Rwanda phone number format (must be +250XXXXXXXXX)"),
  momo_msisdn: z
    .string()
    .min(1, "Mobile Money number is required")
    .regex(/^\+250[0-9]{9}$/, "Invalid Rwanda phone number format (must be +250XXXXXXXXX)"),
  lang: z.string().optional().default("en"),
});

/**
 * POST handler for member onboarding
 * Creates a new member profile with provided contact information
 */
export async function POST(request: Request) {
  try {
    // Initialize Supabase client with user session
    const supabase = await createSupabaseServerClient();

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required", details: "Please sign in to continue" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = onboardingSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    const { whatsapp_msisdn, momo_msisdn, lang } = validationResult.data;

    // Check if profile already exists for this user
    const { data: existingProfile } = await supabase
      .from("members_app_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        {
          error: "Profile already exists",
          details: "A profile has already been created for this account",
        },
        { status: 409 }
      );
    }

    // Insert new member profile
    // RLS policy ensures user can only insert their own profile
    const { data: profile, error: insertError } = await supabase
      .from("members_app_profiles")
      .insert({
        user_id: user.id,
        whatsapp_msisdn,
        momo_msisdn,
        lang,
        is_verified: false, // Verification happens separately
      })
      .select()
      .single();

    if (insertError) {
      console.error("Profile insertion error:", insertError);
      return NextResponse.json(
        {
          error: "Failed to create profile",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    // Return success response with created profile data
    return NextResponse.json(
      {
        success: true,
        data: {
          user_id: profile.user_id,
          whatsapp_msisdn: profile.whatsapp_msisdn,
          momo_msisdn: profile.momo_msisdn,
          lang: profile.lang,
          created_at: profile.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
