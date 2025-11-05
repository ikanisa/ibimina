/**
 * Border radius tokens following 4pt grid.
 */
export const radii = {
  sm: 6, // Small elements
  base: 8, // Default
  md: 12, // Cards
  lg: 16, // Large cards
  xl: 24, // Hero sections
  "2xl": 32, // Feature cards
  pill: 999, // Fully rounded
} as const;

export type RadiusToken = keyof typeof radii;

/**
 * Systematic 8pt spacing scale.
 *
 * Usage:
 * - 0-2: Internal component padding
 * - 3-5: Component gaps
 * - 6-7: Section spacing
 * - 8-10: Page-level spacing
 */
const spacingUnit = 4;

export type SpacingStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 12 | 16;

export const spacingScale: Record<SpacingStep, number> = {
  0: 0, // 0px
  1: 4, // 4px
  2: 8, // 8px
  3: 12, // 12px
  4: 16, // 16px
  5: 20, // 20px
  6: 24, // 24px
  7: 32, // 32px
  8: 40, // 40px
  9: 48, // 48px
  10: 64, // 64px
  12: 96, // 96px
  16: 128, // 128px
};

/**
 * Returns spacing based on the 8px baseline grid (4px base unit).
 * Accepts predefined steps or arbitrary multipliers for finer control.
 */
export function spacing(step: SpacingStep | number): number {
  if (step in spacingScale) {
    return spacingScale[step as SpacingStep];
  }

  return step * spacingUnit;
}

/**
 * Typography scale - systematic sizes with proper line heights.
 */
export const typography = {
  fontFamily: {
    sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "JetBrains Mono, Menlo, Monaco, 'Courier New', monospace",
  },
  fontSize: {
    xs: 12, // 0.75rem
    sm: 14, // 0.875rem
    base: 16, // 1rem
    lg: 18, // 1.125rem
    xl: 20, // 1.25rem
    "2xl": 24, // 1.5rem
    "3xl": 30, // 1.875rem
    "4xl": 36, // 2.25rem
    "5xl": 48, // 3rem
  },
  lineHeight: {
    none: 1,
    tight: 1.16, // Headlines
    snug: 1.25, // Captions
    normal: 1.5, // Body text
    relaxed: 1.75, // Loose paragraphs
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
} as const;

export type TypographyToken = typeof typography;

/**
 * Minimal shadow system for Atlas UI.
 *
 * Replaces heavy glassmorphism with subtle depth.
 */
export interface ShadowPreset {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export const shadowPresets: Record<"sm" | "base" | "md" | "lg" | "xl", ShadowPreset> = {
  sm: {
    shadowColor: "rgb(0, 0, 0)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: "rgb(0, 0, 0)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "rgb(0, 0, 0)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: "rgb(0, 0, 0)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  xl: {
    shadowColor: "rgb(0, 0, 0)",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 16,
  },
};

export type ShadowPresetName = keyof typeof shadowPresets;

/**
 * Animation tokens for consistent motion.
 *
 * All durations support prefers-reduced-motion.
 */
export const animation = {
  duration: {
    fast: 100, // Quick feedback
    normal: 150, // Standard transitions
    slow: 200, // Deliberate animations
  },
  easing: {
    standard: [0.4, 0, 0.2, 1] as const,
    accelerate: [0.4, 0, 1, 1] as const,
    decelerate: [0, 0, 0.2, 1] as const,
  },
} as const;

export type AnimationToken = typeof animation;
