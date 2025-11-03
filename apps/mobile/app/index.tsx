/**
 * Root index - Redirect to home tab
 */

import { Redirect } from "expo-router";
import { useAppStore } from "../src/providers/store";

export default function Index() {
  const { isAuthenticated, hasHydratedAuth } = useAppStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    hasHydratedAuth: state.hasHydratedAuth,
  }));

  if (!hasHydratedAuth) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/auth/start" />;
}
