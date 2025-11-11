/**
 * USSD Pay Sheet API Route Handler
 *
 * GET /api/ussd-pay-sheet
 *
 * This route provides USSD payment instructions for the authenticated member,
 * including merchant codes, reference codes, and payment amounts.
 *
 * Query Parameters:
 * - status: string (optional) - Filter by payment status (PENDING, COMPLETED, FAILED)
 * - ikimina_id: string (optional) - Filter by specific group
 * - limit: number (optional) - Maximum number of results (default: 50, max: 100)
 * - offset: number (optional) - Pagination offset (default: 0)
 *
 * Response:
 * - 200: Pay sheet data returned successfully
 * - 401: User not authenticated
 * - 400: Invalid query parameters
 * - 500: Server error during data retrieval
 *
 * Security:
 * - Requires valid Supabase session (authenticated user)
 * - Row Level Security (RLS) policies ensure users only see their own data
 * - Query parameter validation using Zod schema
 *
 * Accessibility:
 * - Returns structured data designed for accessible presentation
 * - Includes all necessary fields for screen reader friendly displays
 * - USSD codes are provided in both human-readable and dialable formats
 */

import { NextResponse } from "next/server";
import { getUssdPaySheet } from "@/lib/api/ussd-pay-sheet";
import { z } from "zod";

/**
 * Zod schema for query parameter validation
 * Ensures parameters are properly formatted and within acceptable ranges
 */
const queryParamsSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "FAILED"]).nullish(),
  ikimina_id: z.string().uuid("Invalid group ID format").nullish(),
  limit: z.coerce.number().int().min(1).max(100).nullish().default(50),
  offset: z.coerce.number().int().min(0).nullish().default(0),
});

/**
 * GET handler for USSD pay sheet
 * Returns payment instructions with USSD codes for the authenticated user
 *
 * @param request - Next.js request object with URL search parameters
 * @returns JSON response with pay sheet entries or error
 */
export async function GET(request: Request) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const params = {
      status: searchParams.get("status"),
      ikimina_id: searchParams.get("ikimina_id"),
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
    };

    const validationResult = queryParamsSchema.safeParse(params);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: validationResult.error.errors
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(", "),
        },
        { status: 400 }
      );
    }

    const { status, ikimina_id, limit, offset } = validationResult.data;

    // Fetch pay sheet data using the API utility
    const paySheetEntries = await getUssdPaySheet({
      status,
      ikimina_id,
      limit,
      offset,
    });

    // Return success response with pay sheet data
    return NextResponse.json(
      {
        success: true,
        data: paySheetEntries,
        meta: {
          count: paySheetEntries.length,
          limit,
          offset,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("USSD Pay Sheet API error:", error);

    // Handle authentication errors specifically
    if (error instanceof Error && error.message.includes("Authentication required")) {
      return NextResponse.json(
        {
          error: "Authentication required",
          details: "Please sign in to view your pay sheet",
        },
        { status: 401 }
      );
    }

    // Generic server error
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
