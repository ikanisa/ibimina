import type { Config } from 'tailwindcss';
import { designTokens } from './desktop-tokens';

/**
 * Tailwind configuration extended with desktop design tokens
 * Use this in your tailwind.config.ts to apply the desktop token system
 */
export const tailwindDesktopConfig: Partial<Config['theme']> = {
  extend: {
    // Colors
    colors: {
      primary: designTokens.colors.primary,
      accent: designTokens.colors.accent,
      success: {
        light: designTokens.colors.success.light,
        dark: designTokens.colors.success.dark,
        DEFAULT: designTokens.colors.success.light,
      },
      warning: {
        light: designTokens.colors.warning.light,
        dark: designTokens.colors.warning.dark,
        DEFAULT: designTokens.colors.warning.light,
      },
      error: {
        light: designTokens.colors.error.light,
        dark: designTokens.colors.error.dark,
        DEFAULT: designTokens.colors.error.light,
      },
      info: {
        light: designTokens.colors.info.light,
        dark: designTokens.colors.info.dark,
        DEFAULT: designTokens.colors.info.light,
      },
    },

    // Spacing - merge with Tailwind's default spacing
    spacing: designTokens.spacing,

    // Border Radius
    borderRadius: designTokens.radius,

    // Box Shadow
    boxShadow: designTokens.shadows,

    // Font Family
    fontFamily: {
      mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
    },

    // Font Size - with line heights and letter spacing
    fontSize: {
      // Display sizes
      'display-xl': [
        designTokens.typography.display.xl.size,
        {
          lineHeight: String(designTokens.typography.display.xl.lineHeight),
          letterSpacing: designTokens.typography.display.xl.tracking,
          fontWeight: String(designTokens.typography.display.xl.weight),
        },
      ],
      'display-lg': [
        designTokens.typography.display.lg.size,
        {
          lineHeight: String(designTokens.typography.display.lg.lineHeight),
          letterSpacing: designTokens.typography.display.lg.tracking,
          fontWeight: String(designTokens.typography.display.lg.weight),
        },
      ],
      'display-md': [
        designTokens.typography.display.md.size,
        {
          lineHeight: String(designTokens.typography.display.md.lineHeight),
          letterSpacing: designTokens.typography.display.md.tracking,
          fontWeight: String(designTokens.typography.display.md.weight),
        },
      ],
      // Heading sizes
      h1: [
        designTokens.typography.heading.h1.size,
        {
          lineHeight: String(designTokens.typography.heading.h1.lineHeight),
          fontWeight: String(designTokens.typography.heading.h1.weight),
        },
      ],
      h2: [
        designTokens.typography.heading.h2.size,
        {
          lineHeight: String(designTokens.typography.heading.h2.lineHeight),
          fontWeight: String(designTokens.typography.heading.h2.weight),
        },
      ],
      h3: [
        designTokens.typography.heading.h3.size,
        {
          lineHeight: String(designTokens.typography.heading.h3.lineHeight),
          fontWeight: String(designTokens.typography.heading.h3.weight),
        },
      ],
      h4: [
        designTokens.typography.heading.h4.size,
        {
          lineHeight: String(designTokens.typography.heading.h4.lineHeight),
          fontWeight: String(designTokens.typography.heading.h4.weight),
        },
      ],
      // Body sizes
      'body-lg': [
        designTokens.typography.body.lg.size,
        { lineHeight: String(designTokens.typography.body.lg.lineHeight) },
      ],
      'body-md': [
        designTokens.typography.body.md.size,
        { lineHeight: String(designTokens.typography.body.md.lineHeight) },
      ],
      'body-sm': [
        designTokens.typography.body.sm.size,
        { lineHeight: String(designTokens.typography.body.sm.lineHeight) },
      ],
      'body-xs': [
        designTokens.typography.body.xs.size,
        { lineHeight: String(designTokens.typography.body.xs.lineHeight) },
      ],
      // Mono sizes
      'mono-md': [
        designTokens.typography.mono.md.size,
        {
          lineHeight: String(designTokens.typography.mono.md.lineHeight),
        },
      ],
      'mono-sm': [
        designTokens.typography.mono.sm.size,
        {
          lineHeight: String(designTokens.typography.mono.sm.lineHeight),
        },
      ],
    },

    // Transition Duration
    transitionDuration: {
      fast: designTokens.transitions.fast.replace('ms', ''),
      normal: designTokens.transitions.normal.replace('ms', ''),
      slow: designTokens.transitions.slow.replace('ms', ''),
      spring: designTokens.transitions.spring.split(' ')[0].replace('ms', ''),
    },

    // Transition Timing Function
    transitionTimingFunction: {
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },

    // Z-Index (convert to strings for Tailwind)
    zIndex: {
      dropdown: String(designTokens.zIndex.dropdown),
      sticky: String(designTokens.zIndex.sticky),
      fixed: String(designTokens.zIndex.fixed),
      modalBackdrop: String(designTokens.zIndex.modalBackdrop),
      modal: String(designTokens.zIndex.modal),
      popover: String(designTokens.zIndex.popover),
      tooltip: String(designTokens.zIndex.tooltip),
      commandPalette: String(designTokens.zIndex.commandPalette),
      toast: String(designTokens.zIndex.toast),
    },
  },
};

/**
 * Utility to merge desktop tokens with existing Tailwind config
 */
export function withDesktopTokens(baseConfig: Config): Config {
  return {
    ...baseConfig,
    theme: {
      ...baseConfig.theme,
      extend: {
        ...baseConfig.theme?.extend,
        ...tailwindDesktopConfig.extend,
      },
    },
  };
}
