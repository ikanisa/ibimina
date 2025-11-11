/**
 * SACCO API utilities
 * Provides functions for searching and fetching SACCO data
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * SACCO search result interface
 * Represents a single SACCO in search results
 */
export interface SaccoSearchResult {
  id: string;
  name: string;
  district: string;
  sector_code: string;
  merchant_code: string | null;
  province: string | null;
  category: string | null;
}

/**
 * Search parameters for SACCO search
 * Supports text query and geographic filters
 */
export interface SaccoSearchParams {
  query?: string;
  limit?: number;
  district?: string | null;
  sector?: string | null;
}

/**
 * Search for SACCOs using trigram-based semantic search (Server-side)
 * Uses the search_saccos database function for efficient searching
 *
 * @param params - Search parameters including query text and filters
 * @returns Array of SACCO search results
 *
 * @example
 * ```ts
 * const results = await searchSaccos({
 *   query: 'Gasabo',
 *   limit: 20,
 *   district: 'Gasabo'
 * });
 * ```
 *
 * @remarks
 * This function uses server-side Supabase client and should be called
 * from Server Components or API routes only
 */
export async function searchSaccos(params: SaccoSearchParams = {}): Promise<SaccoSearchResult[]> {
  const { query, limit = 20, district, sector } = params;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("search_saccos", {
    query: query || null,
    limit_count: limit,
    district_filter: district || null,
    sector_filter: sector || null,
  });

  if (error) {
    console.error("Error searching SACCOs:", error);
    throw new Error(`Failed to search SACCOs: ${error.message}`);
  }

  return data as SaccoSearchResult[];
}

/**
 * Search for SACCOs using trigram-based semantic search (Client-side)
 * Uses the search_saccos database function for efficient searching
 *
 * @param params - Search parameters including query text and filters
 * @returns Array of SACCO search results
 *
 * @example
 * ```ts
 * const results = await searchSaccosClient({
 *   query: 'Gasabo',
 *   limit: 20
 * });
 * ```
 *
 * @remarks
 * This function uses browser-side Supabase client and should be called
 * from Client Components only
 */
export async function searchSaccosClient(
  params: SaccoSearchParams = {}
): Promise<SaccoSearchResult[]> {
  const { query, limit = 20, district, sector } = params;

  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase.rpc("search_saccos", {
    query: query || null,
    limit_count: limit,
    district_filter: district || null,
    sector_filter: sector || null,
  });

  if (error) {
    console.error("Error searching SACCOs:", error);
    throw new Error(`Failed to search SACCOs: ${error.message}`);
  }

  return data as SaccoSearchResult[];
}

/**
 * Get a single SACCO by ID (Server-side)
 *
 * @param id - SACCO UUID
 * @returns SACCO data or null if not found
 */
export async function getSaccoById(id: string): Promise<SaccoSearchResult | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("saccos")
    .select("id, name, district, sector_code, merchant_code, province, category")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching SACCO:", error);
    return null;
  }

  return data as SaccoSearchResult;
}
