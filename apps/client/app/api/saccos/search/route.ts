/**
 * SACCO Search API Route Handler
 *
 * GET /api/saccos/search
 *
 * This route provides semantic search functionality for SACCOs using trigram
 * similarity search. Users can search for SACCOs by name, district, or other
 * attributes to find and add them to their profile.
 *
 * Query parameters:
 * - q: string (optional) - Search query text
 * - district: string (optional) - Filter by district name
 * - sector: string (optional) - Filter by sector code
 * - limit: number (optional) - Maximum results (default: 20, max: 100)
 *
 * Response:
 * - 200: Search results returned successfully
 * - 400: Invalid query parameters
 * - 401: User not authenticated
 * - 500: Server error during search
 *
 * Security:
 * - Requires valid Supabase session (authenticated user)
 * - Uses RLS-protected database function
 * - Query parameter validation using Zod schema
 *
 * Database:
 * - Function: public.search_saccos (with trigram indexes)
 * - Table: public.saccos (with RLS policies)
 *
 * @accessibility
 * - Returns structured data for accessible presentation
 * - Supports keyboard-friendly search interaction
 */

import { NextResponse } from "next/server";
import { searchSaccos } from "@/lib/api/saccos";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Zod schema for search query parameter validation
 * Ensures parameters are properly formatted and within acceptable ranges
 */
const searchParamsSchema = z.object({
  q: z.string().max(100, "Query must be 100 characters or less").nullish(),
  district: z.string().max(50, "District name must be 50 characters or less").nullish(),
  sector: z.string().max(50, "Sector code must be 50 characters or less").nullish(),
  limit: z.coerce.number().int().min(1).max(100).nullish().default(20),
});

/**
 * GET handler for SACCO search
 * Returns list of SACCOs matching search criteria using trigram similarity
 *
 * @param request - Next.js request object with URL search parameters
 * @returns JSON response with SACCO search results or error
 */
export async function GET(request: Request) {
  try {
    // Verify user authentication
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Authentication required",
          details: "Please sign in to search for SACCOs",
        },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const params = {
      q: searchParams.get("q"),
      district: searchParams.get("district"),
      sector: searchParams.get("sector"),
      limit: searchParams.get("limit"),
    };

    const validationResult = searchParamsSchema.safeParse(params);

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

    const { q, district, sector, limit } = validationResult.data;

    // Perform SACCO search using the API utility
    const results = await searchSaccos({
      query: q || undefined,
      district: district || undefined,
      sector: sector || undefined,
      limit: limit ?? undefined,
    });

    // Return success response with search results
    return NextResponse.json(
      {
        success: true,
        data: results,
        meta: {
          count: results.length,
          query: q || null,
          filters: {
            district: district || null,
            sector: sector || null,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("SACCO search API error:", error);

    // Return server error response
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
