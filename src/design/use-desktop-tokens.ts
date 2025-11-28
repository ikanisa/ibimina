import { useMemo } from 'react';
import { designTokens } from './desktop-tokens';

type ThemeMode = 'light' | 'dark';

/**
 * React hook to access desktop design tokens with theme mode support
 * Converts token values to theme-aware values based on current mode
 */
export function useDesktopTokens(mode: ThemeMode = 'light') {
  return useMemo(() => {
    const { colors, ...restTokens } = designTokens;

    // Resolve theme-based color values
    const resolveColor = (value: any): string => {
      if (typeof value === 'string') return value;
      if (typeof value === 'object' && ('light' in value || 'dark' in value)) {
        return value[mode] || value.light;
      }
      return value;
    };

    const resolveColorScale = (scale: any): Record<string, string> => {
      const resolved: Record<string, string> = {};
      for (const [key, value] of Object.entries(scale)) {
        resolved[key] = resolveColor(value);
      }
      return resolved;
    };

    return {
      ...restTokens,
      colors: {
        primary: resolveColorScale(colors.primary),
        accent: resolveColorScale(colors.accent),
        success: resolveColor(colors.success),
        warning: resolveColor(colors.warning),
        error: resolveColor(colors.error),
        info: resolveColor(colors.info),
        surface: {
          base: resolveColor(colors.surface.base),
          elevated: resolveColor(colors.surface.elevated),
          overlay: resolveColor(colors.surface.overlay),
          glass: resolveColor(colors.surface.glass),
        },
        text: {
          primary: resolveColor(colors.text.primary),
          secondary: resolveColor(colors.text.secondary),
          muted: resolveColor(colors.text.muted),
          inverse: resolveColor(colors.text.inverse),
        },
        border: {
          default: resolveColor(colors.border.default),
          hover: resolveColor(colors.border.hover),
          focus: resolveColor(colors.border.focus),
        },
      },
    };
  }, [mode]);
}

/**
 * Get CSS custom properties from desktop tokens
 * Useful for injecting into global styles or CSS-in-JS
 */
export function getDesktopTokensCss(mode: ThemeMode = 'light'): Record<string, string> {
  const tokens = designTokens;
  const cssVars: Record<string, string> = {};

  // Spacing
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value;
  });

  // Border radius
  Object.entries(tokens.radius).forEach(([key, value]) => {
    cssVars[`--radius-${key}`] = value;
  });

  // Shadows
  Object.entries(tokens.shadows).forEach(([key, value]) => {
    cssVars[`--shadow-${key}`] = value;
  });

  // Transitions
  Object.entries(tokens.transitions).forEach(([key, value]) => {
    cssVars[`--transition-${key}`] = value;
  });

  // Z-index
  Object.entries(tokens.zIndex).forEach(([key, value]) => {
    cssVars[`--z-${key}`] = String(value);
  });

  // Colors - resolve based on mode
  const resolveColor = (value: any): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && ('light' in value || 'dark' in value)) {
      return value[mode] || value.light;
    }
    return value;
  };

  // Primary colors
  Object.entries(tokens.colors.primary).forEach(([key, value]) => {
    cssVars[`--color-primary-${key}`] = value;
  });

  // Accent colors
  Object.entries(tokens.colors.accent).forEach(([key, value]) => {
    cssVars[`--color-accent-${key}`] = value;
  });

  // Semantic colors
  cssVars['--color-success'] = resolveColor(tokens.colors.success);
  cssVars['--color-warning'] = resolveColor(tokens.colors.warning);
  cssVars['--color-error'] = resolveColor(tokens.colors.error);
  cssVars['--color-info'] = resolveColor(tokens.colors.info);

  // Surface colors
  Object.entries(tokens.colors.surface).forEach(([key, value]) => {
    cssVars[`--color-surface-${key}`] = resolveColor(value);
  });

  // Text colors
  Object.entries(tokens.colors.text).forEach(([key, value]) => {
    cssVars[`--color-text-${key}`] = resolveColor(value);
  });

  // Border colors
  Object.entries(tokens.colors.border).forEach(([key, value]) => {
    cssVars[`--color-border-${key}`] = resolveColor(value);
  });

  // Typography
  Object.entries(tokens.typography.display).forEach(([key, value]) => {
    cssVars[`--font-display-${key}-size`] = value.size;
    cssVars[`--font-display-${key}-line-height`] = String(value.lineHeight);
    cssVars[`--font-display-${key}-weight`] = String(value.weight);
    cssVars[`--font-display-${key}-tracking`] = value.tracking;
  });

  Object.entries(tokens.typography.heading).forEach(([key, value]) => {
    cssVars[`--font-heading-${key}-size`] = value.size;
    cssVars[`--font-heading-${key}-line-height`] = String(value.lineHeight);
    cssVars[`--font-heading-${key}-weight`] = String(value.weight);
  });

  Object.entries(tokens.typography.body).forEach(([key, value]) => {
    cssVars[`--font-body-${key}-size`] = value.size;
    cssVars[`--font-body-${key}-line-height`] = String(value.lineHeight);
  });

  Object.entries(tokens.typography.mono).forEach(([key, value]) => {
    cssVars[`--font-mono-${key}-size`] = value.size;
    cssVars[`--font-mono-${key}-line-height`] = String(value.lineHeight);
    cssVars[`--font-mono-${key}-family`] = value.family;
  });

  return cssVars;
}
