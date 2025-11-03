// Revolut-inspired minimalist design system
export const colors = {
  // Core brand colors
  primary: "#0066FF",
  primaryDark: "#0052CC",
  primaryLight: "#3385FF",

  // Neutrals - clean and minimal
  black: "#000000",
  white: "#FFFFFF",

  // Grays - subtle hierarchy
  gray900: "#111111",
  gray800: "#1E1E1E",
  gray700: "#2E2E2E",
  gray600: "#4A4A4A",
  gray500: "#6E6E6E",
  gray400: "#999999",
  gray300: "#C4C4C4",
  gray200: "#E5E5E5",
  gray100: "#F5F5F5",
  gray50: "#FAFAFA",

  // Semantic colors
  success: "#00D964",
  successBg: "#E6F9F0",
  error: "#FF3B30",
  errorBg: "#FFE5E5",
  warning: "#FF9500",
  warningBg: "#FFF3E5",
  info: "#007AFF",
  infoBg: "#E5F2FF",

  // Backgrounds
  background: "#FFFFFF",
  backgroundDark: "#000000",
  surface: "#F8F8F8",
  surfaceDark: "#1C1C1E",
  overlay: "rgba(0, 0, 0, 0.7)",
};

export const typography = {
  // Font families
  regular: "System",
  medium: "System",
  semibold: "System",
  bold: "System",

  // Font sizes - minimalist scale
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 20,
  body: 16,
  bodySmall: 14,
  caption: 12,
  tiny: 10,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
};

export type Theme = typeof theme;
