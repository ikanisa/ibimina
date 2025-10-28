/**
 * Server-side Supabase Client for Client App
 *
 * This module provides Supabase client utilities for server-side operations
 * including Server Components, Route Handlers, and Server Actions.
 *
 * The server client uses cookies to maintain user sessions across requests,
 * ensuring seamless authentication state management.
 *
 * Features:
 * - Cookie-based session management
 * - Type-safe database operations
 * - Server-side only (no client-side bundle impact)
 *
 * Usage in Server Components:
 * ```typescript
 * import { createSupabaseServerClient } from '@/lib/supabase/server';
 *
 * export default async function Page() {
 *   const supabase = await createSupabaseServerClient();
 *   const { data } = await supabase.from('members_app_profiles').select('*');
 *   return <div>{data}</div>;
 * }
 * ```
 *
 * Usage in Route Handlers:
 * ```typescript
 * import { createSupabaseServerClient } from '@/lib/supabase/server';
 *
 * export async function POST(request: Request) {
 *   const supabase = await createSupabaseServerClient();
 *   // ... use supabase
 * }
 * ```
 */

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";
import { requireSupabaseConfig } from "@/lib/supabase/config";

/**
 * Creates a Supabase server client with cookie-based session management
 *
 * This function should be called in server-side contexts (Server Components,
 * Route Handlers, Server Actions). The client automatically reads and manages
 * session cookies.
 *
 * @returns Promise resolving to a configured Supabase server client
 * @throws Error if required environment variables are missing
 */
export async function createSupabaseServerClient() {
  const { url, anonKey } = requireSupabaseConfig("createSupabaseServerClient");
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies - this is expected
          // Cookie mutations should happen in middleware or Server Actions
        }
      },
    },
  });
}
