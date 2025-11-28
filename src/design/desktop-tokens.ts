// Comprehensive Design Token System for Desktop
export const designTokens = {
  // Typography Scale (optimized for desktop readability)
  typography: {
    // Display - for hero sections, dashboards
    display: {
      xl: { size: '3rem', lineHeight: 1.1, weight: 700, tracking: '-0.02em' },
      lg: { size: '2.25rem', lineHeight: 1.15, weight: 700, tracking: '-0.02em' },
      md: { size: '1.875rem', lineHeight: 1.2, weight: 600, tracking: '-0.01em' },
    },
    // Headings - for sections
    heading: {
      h1: { size: '1.5rem', lineHeight: 1.25, weight: 600 },
      h2: { size: '1.25rem', lineHeight: 1.3, weight: 600 },
      h3: { size: '1.125rem', lineHeight: 1.35, weight: 600 },
      h4: { size: '1rem', lineHeight: 1.4, weight: 600 },
    },
    // Body - for content
    body: {
      lg: { size: '1rem', lineHeight: 1.6 },
      md: { size: '0.875rem', lineHeight: 1.5 },
      sm: { size: '0.75rem', lineHeight: 1.45 },
      xs: { size: '0.6875rem', lineHeight: 1.4 },
    },
    // Mono - for data, codes
    mono: {
      md: { size: '0.875rem', lineHeight: 1.5, family: 'JetBrains Mono' },
      sm: { size: '0.75rem', lineHeight: 1.45, family: 'JetBrains Mono' },
    },
  },

  // Spacing Scale (8px base grid)
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    8: '2rem',        // 32px
    10: '2.5rem',     // 40px
    12: '3rem',       // 48px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
  },

  // Color Palette
  colors: {
    // Primary - Kigali Blue (brand)
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    // Accent - Rwandan Gold
    accent: {
      50: '#fefce8',
      100: '#fef9c3',
      200: '#fef08a',
      300: '#fde047',
      400: '#facc15',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12',
    },
    // Semantic Colors
    success: { light: '#10b981', dark: '#34d399' },
    warning: { light: '#f59e0b', dark: '#fbbf24' },
    error: { light: '#ef4444', dark: '#f87171' },
    info: { light: '#3b82f6', dark: '#60a5fa' },
    
    // Surface Colors (Dark Mode First)
    surface: {
      base: { light: '#ffffff', dark: '#0f172a' },
      elevated: { light: '#f8fafc', dark: '#1e293b' },
      overlay: { light: '#f1f5f9', dark: '#334155' },
      glass: { light: 'rgba(255,255,255,0.8)', dark: 'rgba(15,23,42,0.8)' },
    },
    
    // Text Colors
    text: {
      primary: { light: '#0f172a', dark: '#f8fafc' },
      secondary: { light: '#475569', dark: '#94a3b8' },
      muted: { light: '#94a3b8', dark: '#64748b' },
      inverse: { light: '#f8fafc', dark: '#0f172a' },
    },
    
    // Border Colors
    border: {
      default: { light: '#e2e8f0', dark: '#334155' },
      hover: { light: '#cbd5e1', dark: '#475569' },
      focus: { light: '#3b82f6', dark: '#60a5fa' },
    },
  },

  // Shadows (Desktop-optimized depth)
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
    glow: '0 0 20px rgba(59, 130, 246, 0.3)',
  },

  // Border Radius
  radius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },

  // Transitions
  transitions: {
    fast: '150ms ease-out',
    normal: '200ms ease-out',
    slow: '300ms ease-out',
    spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // Z-Index Scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    commandPalette: 1080,
    toast: 1090,
  },
} as const;

// Type exports for TypeScript consumers
export type DesignTokens = typeof designTokens;
export type ColorScale = typeof designTokens.colors.primary;
export type SpacingScale = typeof designTokens.spacing;
export type RadiusScale = typeof designTokens.radius;
export type ShadowScale = typeof designTokens.shadows;
export type TransitionScale = typeof designTokens.transitions;
export type ZIndexScale = typeof designTokens.zIndex;
