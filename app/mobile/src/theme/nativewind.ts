import { useColorScheme } from "react-native";

export type ThemeMode = "light" | "dark";

export type NativeWindScale = {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceTinted: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  tabBar: {
    background: string;
    border: string;
    active: string;
    inactive: string;
    label: string;
  };
  cardShadow: string;
};

export type Palette = {
  background: string;
  card: string;
  border: string;
  primary: string;
  primaryAlt: string;
  textOnPrimary: string;
  textDefault: string;
};

export interface ThemeDefinition {
  mode: ThemeMode;
  classes: NativeWindScale;
  palette: Palette;
}

const base = {
  surfaceTinted: "bg-sky-50 dark:bg-sky-900/40",
  accent: "text-sky-500 dark:text-sky-300",
  cardShadow: "shadow-lg shadow-slate-900/10",
};

const light: ThemeDefinition = {
  mode: "light",
  classes: {
    background: "bg-slate-50",
    surface: "bg-white",
    surfaceMuted: "bg-slate-100",
    surfaceTinted: base.surfaceTinted,
    border: "border border-slate-200",
    textPrimary: "text-slate-900",
    textSecondary: "text-slate-700",
    textMuted: "text-slate-500",
    accent: base.accent,
    tabBar: {
      background: "bg-slate-950",
      border: "border-t border-slate-800",
      active: "text-sky-400",
      inactive: "text-slate-400",
      label: "text-slate-200",
    },
    cardShadow: base.cardShadow,
  },
  palette: {
    background: "#020617",
    card: "#020617",
    border: "rgba(148, 163, 184, 0.2)",
    primary: "#38BDF8",
    primaryAlt: "#0EA5E9",
    textOnPrimary: "#E2E8F0",
    textDefault: "#94A3B8",
  },
};

const dark: ThemeDefinition = {
  mode: "dark",
  classes: {
    background: "bg-slate-900",
    surface: "bg-slate-800",
    surfaceMuted: "bg-slate-700",
    surfaceTinted: "bg-sky-900/70",
    border: "border border-slate-700",
    textPrimary: "text-slate-50",
    textSecondary: "text-slate-200",
    textMuted: "text-slate-400",
    accent: "text-sky-300",
    tabBar: {
      background: "bg-slate-950",
      border: "border-t border-slate-800",
      active: "text-sky-300",
      inactive: "text-slate-500",
      label: "text-slate-100",
    },
    cardShadow: base.cardShadow,
  },
  palette: {
    background: "#020617",
    card: "#0F172A",
    border: "rgba(148, 163, 184, 0.24)",
    primary: "#38BDF8",
    primaryAlt: "#7DD3FC",
    textOnPrimary: "#E2E8F0",
    textDefault: "#CBD5F5",
  },
};

const themes: Record<ThemeMode, ThemeDefinition> = {
  light,
  dark,
};

export function useNativeWindTheme(): ThemeDefinition {
  const scheme = useColorScheme();
  return scheme === "dark" ? themes.dark : themes.light;
}

export function getNativeWindTheme(mode: ThemeMode = "light"): ThemeDefinition {
  return themes[mode];
}
