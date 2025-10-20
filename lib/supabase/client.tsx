"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfigStatus } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/types";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  const status = getSupabaseConfigStatus();

  const url =
    status.hasUrl && status.url.length > 0
      ? status.url
      : "https://stub.supabase.local";
  const anonKey =
    status.hasAnonKey && status.anonKey.length > 0
      ? status.anonKey
      : "stub-anon-key";

  if ((!status.hasUrl || !status.hasAnonKey) && typeof window !== "undefined") {
    console.error("supabase.config.missing", {
      context: "getSupabaseBrowserClient",
      hasUrl: status.hasUrl,
      hasAnonKey: status.hasAnonKey,
    });
  }

  if (!client) {
    client = createBrowserClient<Database>(url, anonKey);
  }

  return client;
}
