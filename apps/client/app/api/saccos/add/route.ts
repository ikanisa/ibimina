/**
 * SACCO Add API Route Handler
 *
 * POST /api/saccos/add
 *
 * This route allows authenticated users to add a SACCO to their profile.
 * The association is stored in the user_saccos table, enabling users to
 * view groups from SACCOs they've added.
 *
 * Request body:
 * - sacco_id: string (required) - UUID of the SACCO to add
 *
 * Response:
 * - 201: SACCO added successfully
 * - 400: Invalid request body or validation error
 * - 401: User not authenticated
 * - 404: SACCO not found
 * - 409: SACCO already added by this user
 * - 500: Server error during addition
 *
 * Security:
 * - Requires valid Supabase session (authenticated user)
 * - Row Level Security (RLS) policies enforce user can only add to their own profile
 * - Input validation using Zod schema
 * - Prevents duplicate associations
 *
 * Database:
 * - Table: public.user_saccos
 * - RLS Policy: "Members manage their SACCO list"
 *
 * @accessibility
 * - Returns clear success/error messages for user feedback
 * - Supports status announcements for screen readers
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

/**
 * Zod schema for add SACCO request validation
 * Ensures required fields are present and properly formatted
 */
const addSaccoSchema = z.object({
  sacco_id: z.string().uuid("Invalid SACCO ID format"),
});

/**
 * POST handler for adding a SACCO to user's profile
 * Creates an association between the authenticated user and a SACCO
 *
 * @param request - Next.js request object
 * @returns JSON response with success status or error
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
        {
          error: "Authentication required",
          details: "Please sign in to add a SACCO",
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = addSaccoSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    const { sacco_id } = validationResult.data;

    // Verify SACCO exists and is active
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sacco, error: saccoError } = await (supabase as any)
      .from("saccos")
      .select("id, name, status")
      .eq("id", sacco_id)
      .single();

    if (saccoError || !sacco) {
      return NextResponse.json(
        {
          error: "SACCO not found",
          details: "The specified SACCO does not exist",
        },
        { status: 404 }
      );
    }

    if (sacco.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error: "SACCO not active",
          details: "This SACCO is not currently accepting new members",
        },
        { status: 400 }
      );
    }

    // Check if user has already added this SACCO
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingAssociation } = await (supabase as any)
      .from("user_saccos")
      .select("user_id, sacco_id")
      .eq("user_id", user.id)
      .eq("sacco_id", sacco_id)
      .maybeSingle();

    if (existingAssociation) {
      return NextResponse.json(
        {
          error: "SACCO already added",
          details: "You have already added this SACCO to your profile",
        },
        { status: 409 }
      );
    }

    // Create the user-SACCO association
    // RLS policy ensures user can only insert their own association
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: association, error: insertError } = await (supabase as any)
      .from("user_saccos")
      .insert({
        user_id: user.id,
        sacco_id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("SACCO association insertion error:", insertError);
      return NextResponse.json(
        {
          error: "Failed to add SACCO",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    // Return success response with association data
    return NextResponse.json(
      {
        success: true,
        message: "SACCO added successfully",
        data: {
          user_id: association.user_id,
          sacco_id: association.sacco_id,
          sacco_name: sacco.name,
          created_at: association.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add SACCO error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
