"use client";

import { useCallback, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  resetAuthCache,
  updateAuthCacheScope,
  updateOnboardingQueueUser,
} from "@/lib/offline/sync";
import { setOnboardingQueueUser } from "@/lib/offline/onboarding-queue";

export function SupabaseAuthListener() {
  const syncOnboardingScope = useCallback((userId: string | null) => {
    setOnboardingQueueUser(userId);
    void updateOnboardingQueueUser(userId);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Keep server-side auth state in sync for RSC/API calls.
      const shouldSyncSession =
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "PASSWORD_RECOVERY" ||
        event === "MFA_CHALLENGE_VERIFIED";

      if (shouldSyncSession) {
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

      // Update the offline cache's auth scope (from codex branch)
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        const credential = session?.access_token ?? session?.refresh_token ?? null;
        void updateAuthCacheScope(credential);
        const userId = session?.user?.id ?? null;
        syncOnboardingScope(userId);
      }
      if (event === "SIGNED_OUT") {
        void updateAuthCacheScope(null);
        syncOnboardingScope(null);
      }

      // Bust high-priority caches when auth boundary changes (from main)
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "MFA_CHALLENGE_VERIFIED") {
        void resetAuthCache();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncOnboardingScope]);

  return null;
}
