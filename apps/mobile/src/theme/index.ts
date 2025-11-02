/**
 * Central theme export
 * Rwanda-inspired design system for Ibimina mobile app
 */

export { colors, gradients } from "./colors";
export {
  fontFamilies,
  fontSizes,
  lineHeights,
  letterSpacing,
  fontWeights,
  textStyles,
} from "./typography";
export { spacing, borderRadius, elevation, glassmorphism } from "./spacing";

// Re-export as a complete theme object
import { colors, gradients } from "./colors";
import {
  fontFamilies,
  fontSizes,
  lineHeights,
  letterSpacing,
  fontWeights,
  textStyles,
} from "./typography";
import { spacing, borderRadius, elevation, glassmorphism } from "./spacing";

export const theme = {
  colors,
  gradients,
  fonts: {
    families: fontFamilies,
    sizes: fontSizes,
    lineHeights,
    letterSpacing,
    weights: fontWeights,
  },
  textStyles,
  spacing,
  borderRadius,
  elevation,
  glassmorphism,
};

export type Theme = typeof theme;
