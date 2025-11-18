import { cookies } from "next/headers";
import { createBrowserClient, createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";
import { requireSupabaseConfig } from "@/lib/supabase/config";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Shared Supabase client factory for browser components.
 * Reads credentials from environment variables to avoid hardcoding project values.
 */
export function getSupabaseClient() {
  const { url, anonKey } = requireSupabaseConfig("supabase-browser-client");

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(url, anonKey);
  }

  return browserClient;
}

/**
 * Server-side Supabase client for Route Handlers and Server Components.
 * Uses request cookies to maintain session continuity during SSR.
 */
export async function getSupabaseServerClient() {
  const { url, anonKey } = requireSupabaseConfig("supabase-server-client");
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Server Components cannot mutate cookies; middleware handles writes.
      },
    },
  });
}

/**
 * Middleware-ready Supabase client that can read/write auth cookies.
 * Ensures refreshed tokens are forwarded to the response pipeline.
 */
export function getSupabaseMiddlewareClient(request: NextRequest, response: NextResponse) {
  const { url, anonKey } = requireSupabaseConfig("supabase-middleware-client");

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}
