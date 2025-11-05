/**
 * Main app entry point with global providers
 */

import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ReactQueryProvider } from "./providers/ReactQueryProvider";
import { I18nProvider } from "./providers/I18nProvider";
import { SupabaseProvider } from "./providers/supabase-client";
import { initSentry } from "./lib/sentry";
import { initPostHog } from "./lib/posthog";
import { useAppStore } from "./providers/store";
import { hydrateAuthToken, getStoredAuthToken } from "./storage/authToken";
import { useFeatureFlags } from "./features/feature-flags/hooks/useFeatureFlags";

// Initialize monitoring and analytics
initSentry();

function FeatureFlagBootstrapper({ children }: { children: React.ReactNode }) {
  const setFeatureFlags = useAppStore((state) => state.setFeatureFlags);
  const { data } = useFeatureFlags();

  useEffect(() => {
    if (!data) {
      return;
    }
    const flattened = Object.entries(data).reduce<Record<string, boolean>>((acc, [key, value]) => {
      acc[key] = value.enabled;
      return acc;
    }, {});
    setFeatureFlags(flattened);
  }, [data, setFeatureFlags]);

  return <>{children}</>;
}

function AppProviderBody({ children }: { children: React.ReactNode }) {
  const setAuthToken = useAppStore((state) => state.setAuthToken);
  const setHasHydratedAuth = useAppStore((state) => state.setHasHydratedAuth);

  useEffect(() => {
    initPostHog();

    let isMounted = true;
    (async () => {
      try {
        const existing = getStoredAuthToken();
        if (existing) {
          setAuthToken(existing);
          setHasHydratedAuth(true);
          return;
        }
        const token = await hydrateAuthToken();
        if (!isMounted) {
          return;
        }
        if (token) {
          setAuthToken(token);
        }
        setHasHydratedAuth(true);
      } catch (error) {
        if (isMounted) {
          setHasHydratedAuth(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [setAuthToken, setHasHydratedAuth]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ReactQueryProvider>
          <I18nProvider>
            <FeatureFlagBootstrapper>{children}</FeatureFlagBootstrapper>
          </I18nProvider>
        </ReactQueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseProvider>
      <AppProviderBody>{children}</AppProviderBody>
    </SupabaseProvider>
  );
}
