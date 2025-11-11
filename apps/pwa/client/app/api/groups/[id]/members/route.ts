/**
 * Group Members API Route Handler
 *
 * GET /api/groups/[id]/members
 *
 * This route returns the list of members for a specific group (Ikimina).
 * Access is restricted by Row Level Security - only authenticated users who
 * are members of the group can view the members list.
 *
 * Query parameters:
 * - status: string (optional) - Filter by member status (default: "ACTIVE")
 * - limit: number (optional) - Maximum number of results (default: 100, max: 500)
 * - offset: number (optional) - Pagination offset (default: 0)
 *
 * Response:
 * - 200: Members list returned successfully
 * - 400: Invalid query parameters
 * - 401: User not authenticated
 * - 403: User not authorized to view members (not a group member)
 * - 404: Group not found
 * - 500: Server error
 *
 * Security:
 * - Requires valid Supabase session (authenticated user)
 * - Row Level Security (RLS) policies enforce member-only access
 * - Masked sensitive data (phone numbers, national IDs) returned
 *
 * Database:
 * - View: public.ikimina_members_public (with RLS)
 * - Original Table: public.ikimina_members
 * - RLS Policy: Only accessible to group members
 *
 * @accessibility
 * - Returns structured, semantic data for accessible presentation
 * - Clear error messages for user feedback
 * - Supports pagination for large member lists
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET handler for fetching group members
 * Returns list of members with masked sensitive information
 *
 * @param request - Next.js request object
 * @param context - Route context with group ID parameter
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ACTIVE";
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    // Validate and parse pagination parameters
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 500) : 100;
    const offset = offsetParam ? Math.max(parseInt(offsetParam, 10), 0) : 0;

    if (isNaN(limit) || isNaN(offset)) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: "Limit and offset must be valid numbers",
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
          details: "Please sign in to view group members",
        },
        { status: 401 }
      );
    }

    // Verify group exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: group, error: groupError } = await (supabase as any)
      .from("ibimina")
      .select("id, name, status")
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

    // Verify the requesting user is an active member of this group
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: isMember, error: membershipError } = await (supabase as any).rpc(
      "is_user_member_of_group",
      { gid: groupId }
    );

    if (membershipError) {
      console.error("Error verifying group membership:", membershipError);
      return NextResponse.json(
        {
          error: "Failed to verify membership",
          details: membershipError.message,
        },
        { status: 500 }
      );
    }

    if (!isMember) {
      return NextResponse.json(
        {
          error: "Access denied",
          details: "You must be a member of this group to view its members.",
        },
        { status: 403 }
      );
    }

    // Fetch members using the public view with RLS enforcement
    // The RLS policies will automatically restrict access to authorized users
    const {
      data: members,
      error: membersError,
      count,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = await (supabase as any)
      .from("ikimina_members_public")
      .select("id, member_code, full_name, status, joined_at, msisdn, national_id", {
        count: "exact",
      })
      .eq("ikimina_id", groupId)
      .eq("status", status)
      .order("joined_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (membersError) {
      console.error("Error fetching group members:", membersError);

      // Check if error is due to insufficient permissions
      if (membersError.code === "42501" || membersError.message.includes("permission")) {
        return NextResponse.json(
          {
            error: "Access denied",
            details:
              "You do not have permission to view this group's members. Only group members can access this information.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to fetch members",
          details: membersError.message,
        },
        { status: 500 }
      );
    }

    // Return success response with members data and pagination info
    return NextResponse.json(
      {
        success: true,
        data: {
          group: {
            id: group.id,
            name: group.name,
          },
          members: members || [],
          pagination: {
            limit,
            offset,
            total: count || 0,
            has_more: count ? offset + limit < count : false,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Group members error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
