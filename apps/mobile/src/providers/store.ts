/**
 * Zustand store for global state management
 */

import { create } from "zustand";

type Locale = "en" | "rw" | "fr";

interface AppState {
  // User state
  userId: string | null;
  isAuthenticated: boolean;
  authToken: string | null;
  hasHydratedAuth: boolean;

  // UI state
  locale: Locale;
  theme: "light" | "dark";

  // Feature flags
  featureFlags: Record<string, any>;

  // Actions
  setUserId: (userId: string | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setAuthToken: (token: string | null) => void;
  setHasHydratedAuth: (hydrated: boolean) => void;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: "light" | "dark") => void;
  setFeatureFlags: (flags: Record<string, any>) => void;
  reset: () => void;
}

const initialState = {
  userId: null,
  isAuthenticated: false,
  authToken: null,
  hasHydratedAuth: false,
  locale: "rw" as Locale,
  theme: "dark" as const,
  featureFlags: {},
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setUserId: (userId) => set({ userId }),
  setAuthenticated: (isAuthenticated) =>
    set((state) => ({
      isAuthenticated,
      authToken: isAuthenticated ? state.authToken : null,
    })),
  setAuthToken: (authToken) =>
    set({
      authToken,
      isAuthenticated: Boolean(authToken),
    }),
  setHasHydratedAuth: (hasHydratedAuth) => set({ hasHydratedAuth }),
  setLocale: (locale) => set({ locale }),
  setTheme: (theme) => set({ theme }),
  setFeatureFlags: (featureFlags) => set({ featureFlags }),
  reset: () => set(initialState),
}));
