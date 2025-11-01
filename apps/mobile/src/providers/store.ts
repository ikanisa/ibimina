/**
 * Zustand store for global state management
 */

import { create } from "zustand";

type Locale = "en" | "rw" | "fr";

interface AppState {
  // User state
  userId: string | null;
  isAuthenticated: boolean;
  
  // UI state
  locale: Locale;
  theme: "light" | "dark";
  
  // Feature flags
  featureFlags: Record<string, any>;
  
  // Actions
  setUserId: (userId: string | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: "light" | "dark") => void;
  setFeatureFlags: (flags: Record<string, any>) => void;
  reset: () => void;
}

const initialState = {
  userId: null,
  isAuthenticated: false,
  locale: "rw" as Locale,
  theme: "dark" as const,
  featureFlags: {},
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,
  
  setUserId: (userId) => set({ userId }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setLocale: (locale) => set({ locale }),
  setTheme: (theme) => set({ theme }),
  setFeatureFlags: (featureFlags) => set({ featureFlags }),
  reset: () => set(initialState),
}));
