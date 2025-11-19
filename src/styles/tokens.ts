export type MinimalThemeMode = "light" | "dark";

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

const radii = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

const typography = {
  heading: { size: 28, lineHeight: 34, weight: "700" as const },
  title: { size: 22, lineHeight: 28, weight: "700" as const },
  body: { size: 16, lineHeight: 24, weight: "500" as const },
  caption: { size: 14, lineHeight: 20, weight: "500" as const },
} as const;

const colorPalettes: Record<
  MinimalThemeMode,
  {
    background: string;
    surface: string;
    surfaceMuted: string;
    border: string;
    primary: string;
    accent: string;
    text: string;
    textMuted: string;
    inverseText: string;
    focus: string;
  }
> = {
  light: {
    background: "#f5f7fb",
    surface: "#ffffff",
    surfaceMuted: "#e2e8f0",
    border: "rgba(148, 163, 184, 0.5)",
    primary: "#4a70ff",
    accent: "#1bb06e",
    text: "#0f172a",
    textMuted: "#475467",
    inverseText: "#f8fafc",
    focus: "rgba(74, 112, 255, 0.45)",
  },
  dark: {
    background: "#0b1220",
    surface: "#131f32",
    surfaceMuted: "#1d2f4d",
    border: "rgba(99, 115, 139, 0.5)",
    primary: "#6c84ff",
    accent: "#27a572",
    text: "#f5f7fb",
    textMuted: "#c7d1e2",
    inverseText: "#0d1324",
    focus: "rgba(125, 211, 252, 0.85)",
  },
};

export type MinimalTheme = {
  mode: MinimalThemeMode;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  colors: (typeof colorPalettes)[MinimalThemeMode];
};

export const getMinimalTheme = (mode: MinimalThemeMode = "dark"): MinimalTheme => ({
  mode,
  spacing,
  radii,
  typography,
  colors: colorPalettes[mode],
});
