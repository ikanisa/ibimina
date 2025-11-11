"use client";

/**
 * Browser-side Supabase Client for Client App
 *
 * This module provides a singleton Supabase client for use in client-side
 * React components. The client automatically handles session management
 * through browser cookies.
 *
 * Features:
 * - Singleton pattern to avoid creating multiple client instances
 * - Automatic session persistence via cookies
 * - Type-safe database operations using generated types
 *
 * Usage:
 * ```typescript
 * import { getSupabaseBrowserClient } from '@/lib/supabase/client';
 *
 * const supabase = getSupabaseBrowserClient();
 * const { data, error } = await supabase.from('members_app_profiles').select('*');
 * ```
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Gets or creates a Supabase browser client instance
 *
 * @returns Configured Supabase client for browser use
 * @throws Error if Supabase environment variables are not configured
 */
export function getSupabaseBrowserClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase environment variables are not configured. " +
        "Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
    );
  }

  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  return client;
}

/**
 * Alias for getSupabaseBrowserClient for backward compatibility
 */
export const createSupabaseBrowserClient = getSupabaseBrowserClient;
