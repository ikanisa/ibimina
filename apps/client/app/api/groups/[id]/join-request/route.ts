/**
 * Join Request API Route Handler
 *
 * POST /api/groups/[id]/join-request
 *
 * This route handles join requests for groups (Ibimina). Users can request
 * to join a group, and the request will be stored for admin approval.
 *
 * Request body:
 * - sacco_id: string (required) - SACCO UUID that the group belongs to
 * - note: string (optional) - Optional note to include with the request
 *
 * Response:
 * - 201: Join request created successfully
 * - 400: Invalid request body or validation error
 * - 401: User not authenticated
 * - 409: Join request already exists for this user/group combination
 * - 500: Server error during request creation
 *
 * Security:
 * - Requires valid Supabase session (authenticated user)
 * - Row Level Security (RLS) policies enforce user can only create their own requests
 * - Input validation using Zod schema
 * - Prevents duplicate requests
 *
 * Database:
 * - Table: public.join_requests
 * - RLS Policy: "Members create join requests"
 *
 * @accessibility
 * - Returns clear success/error messages for user feedback
 * - Supports status announcements for screen readers
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

/**
 * Zod schema for join request validation
 * Ensures required fields are present and properly formatted
 */
const joinRequestSchema = z.object({
  sacco_id: z.string().uuid("Invalid SACCO ID format"),
  note: z.string().max(500, "Note must be 500 characters or less").optional(),
});

/**
 * POST handler for creating group join requests
 * Allows authenticated users to request membership in a group
 *
 * @param request - Next.js request object
 * @param context - Route context with group ID parameter
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    // Get the group ID from route parameters
    const params = await context.params;
    const groupId = params.id;

    // Validate group ID format
    if (
      !groupId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(groupId)
    ) {
      return NextResponse.json(
        {
          error: "Invalid group ID",
          details: "Group ID must be a valid UUID",
        },
        { status: 400 }
      );
    }

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
          details: "Please sign in to request group membership",
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = joinRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    const { sacco_id, note } = validationResult.data;

    // Verify group exists and get its details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: group, error: groupError } = await (supabase as any)
      .from("ibimina")
      .select("id, name, status, sacco_id")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        {
          error: "Group not found",
          details: "The specified group does not exist",
        },
        { status: 404 }
      );
    }

    // Verify the group belongs to the specified SACCO
    if (group.sacco_id !== sacco_id) {
      return NextResponse.json(
        {
          error: "Invalid SACCO",
          details: "The group does not belong to the specified SACCO",
        },
        { status: 400 }
      );
    }

    // Check if group is active
    if (group.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error: "Group not active",
          details: "This group is not currently accepting new members",
        },
        { status: 400 }
      );
    }

    // Check if user already has a pending or approved request for this group
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingRequest } = await (supabase as any)
      .from("join_requests")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("group_id", groupId)
      .in("status", ["pending", "approved"])
      .maybeSingle();

    if (existingRequest) {
      const statusMessage =
        existingRequest.status === "approved"
          ? "You are already a member of this group"
          : "You have already requested to join this group. Please wait for approval.";

      return NextResponse.json(
        {
          error: "Request already exists",
          details: statusMessage,
        },
        { status: 409 }
      );
    }

    // Create the join request
    // RLS policy ensures user can only insert their own request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: joinRequest, error: insertError } = await (supabase as any)
      .from("join_requests")
      .insert({
        user_id: user.id,
        group_id: groupId,
        sacco_id,
        note: note || null,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Join request insertion error:", insertError);
      return NextResponse.json(
        {
          error: "Failed to create join request",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    // Return success response with created request data
    return NextResponse.json(
      {
        success: true,
        message: "Join request submitted successfully",
        data: {
          id: joinRequest.id,
          group_id: joinRequest.group_id,
          group_name: group.name,
          status: joinRequest.status,
          created_at: joinRequest.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Join request error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
