"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { resetAuthCache } from "@/lib/offline/sync";

export function SupabaseAuthListener() {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Keep server-side auth state in sync for RSC/API calls.
      // Ignore events without a session payload to avoid unnecessary network traffic.
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "PASSWORD_RECOVERY") {
        void fetch("/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ event, session }),
        });
      }

      if (event === "SIGNED_OUT") {
        void fetch("/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ event, session: null }),
        });
      }

      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        void resetAuthCache();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
