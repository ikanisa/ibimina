/**
 * Supabase Configuration for Client App
 *
 * This module provides type-safe access to Supabase environment variables.
 * All configuration values are validated at runtime to ensure proper setup.
 *
 * Required environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL: The Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: The anonymous (public) API key
 */

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Retrieves and validates Supabase configuration from environment variables
 *
 * @param caller - Name of the calling function (for error reporting)
 * @returns Validated Supabase configuration
 * @throws Error if required environment variables are missing
 */
export function requireSupabaseConfig(caller: string): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      `${caller}: Missing required Supabase environment variables. ` +
        `Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.`
    );
  }

  return { url, anonKey };
}
