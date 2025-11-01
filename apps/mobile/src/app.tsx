/**
 * Main app entry point with global providers
 */

import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ReactQueryProvider } from "./providers/ReactQueryProvider";
import { I18nProvider } from "./providers/I18nProvider";
import { initSentry } from "./lib/sentry";
import { initPostHog } from "./lib/posthog";
import { initFeatureFlags, getAllFeatureFlags } from "./lib/featureFlags";
import { useAppStore } from "./providers/store";
import { hydrateAuthToken, getStoredAuthToken } from "./storage/authToken";

// Initialize monitoring and analytics
initSentry();

export function AppProviders({ children }: { children: React.ReactNode }) {
  const setFeatureFlags = useAppStore((state) => state.setFeatureFlags);
  const userId = useAppStore((state) => state.userId);
  const setAuthToken = useAppStore((state) => state.setAuthToken);
  const setHasHydratedAuth = useAppStore((state) => state.setHasHydratedAuth);

  useEffect(() => {
    // Initialize PostHog
    initPostHog();

    // Initialize ConfigCat
    initFeatureFlags();

    // Hydrate auth token from secure storage
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

    // Load feature flags
    async function loadFeatureFlags() {
      const flags = await getAllFeatureFlags(userId || undefined);
      setFeatureFlags(flags);
    }

    loadFeatureFlags();
    return () => {
      isMounted = false;
    };
  }, [userId, setFeatureFlags, setAuthToken, setHasHydratedAuth]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ReactQueryProvider>
          <I18nProvider>{children}</I18nProvider>
        </ReactQueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
