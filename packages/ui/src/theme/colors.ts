/**
 * Rwanda-inspired color system for the mobile design language.
 *
 * These tokens encapsulate the national palette, accent tones, and
 * glassmorphism surfaces used throughout the Ibimina mobile experience.
 */

export const rwandaPalette = {
  /** Primary brand blue drawn from the Rwanda flag */
  blue: "#00A1DE",
  /** Deep royal blue used for gradients and emphasis */
  royal: "#0033FF",
  /** Vibrant yellow for calls to action and highlights */
  yellow: "#FAD201",
  /** Grounded green conveying trust and financial wellness */
  green: "#20603D",
  /** Ink tone for typography on light surfaces */
  ink: "#0B1020",
} as const;

export type RwandaPaletteKey = keyof typeof rwandaPalette;

export const neutralPalette = {
  0: "#FFFFFF",
  50: "#F7F9FB",
  100: "#E8EDF1",
  900: "#1A1F25",
} as const;

export type NeutralPaletteKey = keyof typeof neutralPalette;

export const accentColors = {
  /** Primary interactive color, slightly deeper than the flag blue */
  primary: "#0674D6",
  /** Success state derived from Rwanda's fertile landscape */
  success: "#1BB06E",
  /** Informational tone aligned with the national blue */
  info: "#00A1DE",
  /** Attention-grabbing tone that pairs with yellow highlights */
  warning: "#FAD201",
  /** Alert tone tuned for accessibility on light and dark surfaces */
  danger: "#D7263D",
} as const;

export type AccentColorKey = keyof typeof accentColors;

export const glassTokens = {
  /** Default translucent surface for light mode */
  background: "rgba(255, 255, 255, 0.14)",
  /** Elevated background for dark mode overlays */
  backgroundDark: "rgba(17, 26, 35, 0.68)",
  /** Stroke used to outline glass surfaces */
  stroke: "rgba(255, 255, 255, 0.28)",
  /** Subtle highlight for edges and separators */
  highlight: "rgba(255, 255, 255, 0.4)",
  /** Shadow tint applied behind glass containers */
  shadow: "rgba(11, 16, 32, 0.28)",
} as const;

export type GlassTokenKey = keyof typeof glassTokens;

export const themeColors = {
  palette: rwandaPalette,
  neutrals: neutralPalette,
  accent: accentColors,
  glass: glassTokens,
} as const;

export type ThemeColors = typeof themeColors;
