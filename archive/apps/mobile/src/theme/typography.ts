/**
 * Typography scale and font definitions
 * System font stack for optimal native performance
 */

export const fontFamilies = {
  sans: "System",
  mono: "Courier",
};

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
};

export const lineHeights = {
  xs: 16,
  sm: 20,
  base: 24,
  lg: 28,
  xl: 30,
  "2xl": 32,
  "3xl": 38,
  "4xl": 44,
  "5xl": 56,
};

export const letterSpacing = {
  tight: -0.03,
  normal: 0,
  wide: 0.01,
};

export const fontWeights = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

/**
 * Text style presets
 */
export const textStyles = {
  h1: {
    fontSize: fontSizes["4xl"],
    lineHeight: lineHeights["4xl"],
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontSize: fontSizes["3xl"],
    lineHeight: lineHeights["3xl"],
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontSize: fontSizes["2xl"],
    lineHeight: lineHeights["2xl"],
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.tight,
  },
  h4: {
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.tight,
  },
  body: {
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.normal,
  },
  bodyMedium: {
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.normal,
  },
  bodySemibold: {
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.normal,
  },
  small: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.wide,
  },
  smallMedium: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.wide,
  },
  caption: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.wide,
  },
};
