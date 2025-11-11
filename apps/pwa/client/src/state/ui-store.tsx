"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { DEFAULT_LOCALE, resolveAppLocale, type SupportedLocale } from "@/lib/i18n/messages";

export type ThemeMode = "light" | "dark";

interface UIState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  language: SupportedLocale;
  setLanguage: (language: SupportedLocale) => void;
}

const UIContext = createContext<UIState | undefined>(undefined);

const THEME_STORAGE_KEY = "ibimina:theme";
const LANGUAGE_STORAGE_KEY = "ibimina:language";

function resolveInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveInitialLanguage(): SupportedLocale {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return resolveAppLocale(stored);
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => resolveInitialTheme());
  const [language, setLanguageState] = useState<SupportedLocale>(() => resolveInitialLanguage());

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
    document.body.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("lang", language);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const listener = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setThemeState("dark");
      }
    };

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const setTheme = useCallback((value: ThemeMode) => {
    setThemeState(value);
  }, []);

  const setLanguage = useCallback((value: SupportedLocale) => {
    setLanguageState(resolveAppLocale(value));
  }, []);

  const value = useMemo<UIState>(
    () => ({ theme, setTheme, language, setLanguage }),
    [theme, setTheme, language, setLanguage]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUIStore(): UIState {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error("useUIStore must be used within a UIProvider");
  }
  return ctx;
}
