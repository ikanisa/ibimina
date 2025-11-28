/**
 * Design System Entry Point
 * 
 * Exports:
 * - Desktop design tokens (comprehensive token system)
 * - Original theme tokens (CSS var-based system)
 * - React hooks for consuming tokens
 * - Tailwind configuration utilities
 */

// Desktop token system
export { designTokens as desktopTokens } from './desktop-tokens';
export type {
  DesignTokens,
  ColorScale,
  SpacingScale,
  RadiusScale,
  ShadowScale,
  TransitionScale,
  ZIndexScale,
} from './desktop-tokens';

// Desktop token utilities
export { useDesktopTokens, getDesktopTokensCss } from './use-desktop-tokens';
export { tailwindDesktopConfig, withDesktopTokens } from './tailwind-desktop';

// Original CSS var-based theme system (for backward compatibility)
export {
  tailwindTokens,
  designTokens,
  themeNames,
  themeAliases,
  nextThemeValueMap,
  resolveTheme,
  getTheme,
} from './theme';
export type { ThemeName, ThemeAlias, ThemeDefinition } from './theme';
