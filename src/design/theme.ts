const cssVar = (token: string) => `var(--${token})`;

const NEUTRAL_SCALE = [
  "0",
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
] as const;
const PALETTE_SCALE = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
] as const;

const createCssScale = <T extends readonly string[]>(prefix: string, steps: T) =>
  steps.reduce<Record<T[number], string>>(
    (acc, step) => {
      acc[step] = cssVar(`color-${prefix}-${step}`);
      return acc;
    },
    {} as Record<T[number], string>
  );

const spacingScale = {
  px: "1px",
  0: "var(--space-0)",
  1: "var(--space-1)",
  "1.5": "var(--space-1_5)",
  2: "var(--space-2)",
  "2.5": "var(--space-2_5)",
  3: "var(--space-3)",
  "3.5": "var(--space-3_5)",
  4: "var(--space-4)",
  5: "var(--space-5)",
  6: "var(--space-6)",
  7: "var(--space-7)",
  8: "var(--space-8)",
  9: "var(--space-9)",
  10: "var(--space-10)",
  11: "var(--space-11)",
  12: "var(--space-12)",
  16: "var(--space-16)",
  20: "var(--space-20)",
  24: "var(--space-24)",
  28: "var(--space-28)",
  32: "var(--space-32)",
  40: "var(--space-40)",
  48: "var(--space-48)",
  56: "var(--space-56)",
  64: "var(--space-64)",
  72: "var(--space-72)",
  80: "var(--space-80)",
  96: "var(--space-96)",
} as const;

const radiiScale = {
  none: "var(--radius-none)",
  xs: "var(--radius-xs)",
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  "2xl": "var(--radius-2xl)",
  "3xl": "var(--radius-3xl)",
  full: "var(--radius-round)",
} as const;

const shadowScale = {
  xs: "var(--shadow-xs)",
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
  xl: "var(--shadow-xl)",
  focus: "var(--shadow-focus)",
} as const;

const fontFamilyScale = {
  sans: ["var(--font-sans)", "system-ui", "sans-serif"],
  display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
  mono: ["var(--font-mono)", "ui-monospace", "monospace"],
} as const;

const fontSizeScale = {
  xs: [
    "var(--font-size-xs)",
    { lineHeight: "var(--font-line-xs)", letterSpacing: "var(--font-letter-tight)" },
  ],
  sm: ["var(--font-size-sm)", { lineHeight: "var(--font-line-sm)", letterSpacing: "0em" }],
  base: ["var(--font-size-md)", { lineHeight: "var(--font-line-md)", letterSpacing: "0em" }],
  lg: [
    "var(--font-size-lg)",
    { lineHeight: "var(--font-line-lg)", letterSpacing: "var(--font-letter-tight)" },
  ],
  xl: [
    "var(--font-size-xl)",
    { lineHeight: "var(--font-line-xl)", letterSpacing: "var(--font-letter-heading)" },
  ],
  "2xl": [
    "var(--font-size-2xl)",
    { lineHeight: "var(--font-line-2xl)", letterSpacing: "var(--font-letter-heading)" },
  ],
  "3xl": [
    "var(--font-size-3xl)",
    { lineHeight: "var(--font-line-3xl)", letterSpacing: "var(--font-letter-heading)" },
  ],
  "4xl": [
    "var(--font-size-4xl)",
    { lineHeight: "var(--font-line-4xl)", letterSpacing: "var(--font-letter-heading)" },
  ],
} as const;

const motionDurationScale = {
  100: "var(--motion-duration-100)",
  150: "var(--motion-duration-150)",
  200: "var(--motion-duration-200)",
  250: "var(--motion-duration-250)",
  300: "var(--motion-duration-300)",
  400: "var(--motion-duration-400)",
  500: "var(--motion-duration-500)",
  interactive: "var(--motion-duration-150)",
  smooth: "var(--motion-duration-300)",
  long: "var(--motion-duration-500)",
} as const;

const motionEasingScale = {
  standard: "var(--motion-ease-standard)",
  emphasized: "var(--motion-ease-emphasized)",
  expressive: "var(--motion-ease-expressive)",
  linear: "var(--motion-ease-linear)",
} as const;

const breakpointScale = {
  sm: "var(--breakpoint-sm)",
  md: "var(--breakpoint-md)",
  lg: "var(--breakpoint-lg)",
  xl: "var(--breakpoint-xl)",
  "2xl": "var(--breakpoint-2xl)",
} as const;

const neutralCss = createCssScale("neutral", NEUTRAL_SCALE);
const primaryCss = createCssScale("primary", PALETTE_SCALE);
const accentCss = createCssScale("accent", PALETTE_SCALE);
const successCss = createCssScale("success", PALETTE_SCALE);
const warningCss = createCssScale("warning", PALETTE_SCALE);
const dangerCss = createCssScale("danger", PALETTE_SCALE);
const infoCss = createCssScale("info", PALETTE_SCALE);

export const tailwindTokens = {
  colors: {
    canvas: cssVar("color-canvas"),
    surface: {
      DEFAULT: cssVar("color-surface"),
      subtle: cssVar("color-surface-subtle"),
      muted: cssVar("color-surface-muted"),
      contrast: cssVar("color-surface-contrast"),
      elevated: cssVar("color-surface-elevated"),
    },
    border: {
      DEFAULT: cssVar("color-border"),
      subtle: cssVar("color-border-subtle"),
      strong: cssVar("color-border-strong"),
    },
    foreground: {
      DEFAULT: cssVar("color-foreground"),
      muted: cssVar("color-foreground-muted"),
      subtle: cssVar("color-foreground-subtle"),
      inverse: cssVar("color-foreground-inverse"),
    },
    overlay: cssVar("color-overlay"),
    neutral: neutralCss,
    primary: primaryCss,
    accent: accentCss,
    success: successCss,
    warning: warningCss,
    danger: dangerCss,
    info: infoCss,
    state: {
      focus: cssVar("state-focus-ring"),
      hover: cssVar("state-hover"),
      active: cssVar("state-active"),
      overlay: cssVar("state-overlay"),
    },
    gradients: {
      soft: cssVar("gradient-brand-soft"),
      hero: cssVar("gradient-brand-hero"),
      mesh: cssVar("gradient-brand-mesh"),
    },
  },
  spacing: spacingScale,
  borderRadius: radiiScale,
  boxShadow: shadowScale,
  fontFamily: fontFamilyScale,
  fontSize: fontSizeScale,
  transitionDuration: motionDurationScale,
  transitionTimingFunction: motionEasingScale,
  screens: breakpointScale,
} as const;

export const themeNames = ["light", "dark", "high-contrast"] as const;
export type ThemeName = (typeof themeNames)[number];
export const themeAliases = { nyungwe: "dark" } as const;
export type ThemeAlias = keyof typeof themeAliases;

export const nextThemeValueMap = {
  light: "light",
  dark: "dark",
  "high-contrast": "high-contrast",
  nyungwe: "dark",
} as const;

const colorsLight = {
  canvas: "#f5f7fb",
  surface: "#ffffff",
  surfaceSubtle: "#f1f5f9",
  surfaceMuted: "#e2e8f0",
  surfaceContrast: "#101828",
  surfaceElevated: "rgba(255, 255, 255, 0.82)",
  overlay: "rgba(15, 23, 42, 0.62)",
  border: "#d0d5dd",
  borderSubtle: "#e4e7ec",
  borderStrong: "#98a2b3",
  foreground: "#111827",
  foregroundMuted: "#475467",
  foregroundSubtle: "#667085",
  foregroundInverse: "#f8fafc",
  neutral: {
    0: "#ffffff",
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },
  primary: {
    50: "#eef2ff",
    100: "#dbe2ff",
    200: "#c0ccff",
    300: "#9bb0ff",
    400: "#7692ff",
    500: "#4a70ff",
    600: "#3159f3",
    700: "#2647d0",
    800: "#1f3aa6",
    900: "#172b76",
    950: "#0f1c4b",
  },
  accent: {
    50: "#ecfdf3",
    100: "#d1f9e1",
    200: "#aaf0cc",
    300: "#7ce4b1",
    400: "#4dd494",
    500: "#1bb06e",
    600: "#138f56",
    700: "#0d7044",
    800: "#085536",
    900: "#043626",
    950: "#012418",
  },
  success: {
    50: "#ecfdf3",
    100: "#d1fadf",
    200: "#a6f4c5",
    300: "#7ae9a8",
    400: "#4dd18d",
    500: "#16b26c",
    600: "#0f7a4a",
    700: "#0a5a38",
    800: "#063f28",
    900: "#032b1c",
    950: "#011b12",
  },
  warning: {
    50: "#fffaeb",
    100: "#fef0c7",
    200: "#fedf89",
    300: "#fec84b",
    400: "#fdb022",
    500: "#f79009",
    600: "#dc6803",
    700: "#b54708",
    800: "#93370d",
    900: "#7a2e0e",
    950: "#4e1d09",
  },
  danger: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
    950: "#450a0a",
  },
  info: {
    50: "#f0f7ff",
    100: "#dbeafe",
    200: "#c0ddfe",
    300: "#94c5fd",
    400: "#61a7fb",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },
  gradients: {
    soft: "linear-gradient(135deg, rgba(74, 112, 255, 0.32), rgba(27, 176, 110, 0.18))",
    hero: "linear-gradient(130deg, rgba(74, 112, 255, 0.32), rgba(27, 176, 110, 0.18))",
    mesh: "radial-gradient(1200px 800px at 20% 10%, rgba(74, 112, 255, 0.35), rgba(27, 176, 110, 0.24), rgba(4, 12, 30, 0.8))",
  },
} as const;

const colorsDark = {
  canvas: "#05080f",
  surface: "#0d1726",
  surfaceSubtle: "#111f32",
  surfaceMuted: "#15273d",
  surfaceContrast: "#f8fafc",
  surfaceElevated: "rgba(8, 17, 31, 0.86)",
  overlay: "rgba(1, 8, 20, 0.72)",
  border: "#253349",
  borderSubtle: "#1a263a",
  borderStrong: "#3a4b63",
  foreground: "#f5f7fb",
  foregroundMuted: "#c7d1e2",
  foregroundSubtle: "#9aa5bd",
  foregroundInverse: "#0d1324",
  neutral: {
    0: "#05080f",
    50: "#0b1220",
    100: "#111b2d",
    200: "#17243a",
    300: "#1f2f4c",
    400: "#2b3c60",
    500: "#3a4c78",
    600: "#4b5e93",
    700: "#5f74b0",
    800: "#7f91c8",
    900: "#aeb9e1",
    950: "#d9e0f5",
  },
  primary: {
    50: "#111d3b",
    100: "#18274f",
    200: "#1f3263",
    300: "#2b427f",
    400: "#3f59a5",
    500: "#5672d6",
    600: "#6c84ff",
    700: "#8da1ff",
    800: "#afc0ff",
    900: "#d2dcff",
    950: "#e8efff",
  },
  accent: {
    50: "#052a1c",
    100: "#083626",
    200: "#0d4d36",
    300: "#136346",
    400: "#1b855c",
    500: "#27a572",
    600: "#4ec790",
    700: "#74e1ad",
    800: "#a7f2c9",
    900: "#cffae1",
    950: "#edfff4",
  },
  success: {
    50: "#072b1a",
    100: "#0a3a23",
    200: "#0f5231",
    300: "#146a40",
    400: "#1c8c56",
    500: "#23a96a",
    600: "#4dc88a",
    700: "#77e2a9",
    800: "#b0f5ce",
    900: "#dffce9",
    950: "#f3fff5",
  },
  warning: {
    50: "#2f1b03",
    100: "#3d2304",
    200: "#553005",
    300: "#703f07",
    400: "#96580a",
    500: "#b8720e",
    600: "#da9217",
    700: "#f4ad27",
    800: "#fdd163",
    900: "#ffe7a3",
    950: "#fff7d9",
  },
  danger: {
    50: "#330f11",
    100: "#421316",
    200: "#5d1a1e",
    300: "#7d2227",
    400: "#a13030",
    500: "#c5413f",
    600: "#e46261",
    700: "#f58684",
    800: "#fbb9b7",
    900: "#fde1e0",
    950: "#fff4f4",
  },
  info: {
    50: "#091632",
    100: "#0d1f46",
    200: "#122b5e",
    300: "#193978",
    400: "#204a9a",
    500: "#2b5dc2",
    600: "#3a74e6",
    700: "#5c90ff",
    800: "#8db2ff",
    900: "#bed2ff",
    950: "#e3ecff",
  },
  gradients: {
    soft: "linear-gradient(135deg, rgba(86, 114, 214, 0.72), rgba(39, 165, 114, 0.42))",
    hero: "linear-gradient(140deg, rgba(25, 55, 102, 0.9), rgba(27, 165, 114, 0.35))",
    mesh: "radial-gradient(1200px 800px at 20% 10%, rgba(86, 114, 214, 0.42), rgba(39, 165, 114, 0.32), rgba(1, 6, 19, 0.92))",
  },
} as const;

const stateLight = {
  focusRing: "rgba(74, 112, 255, 0.45)",
  focusRingOffset: "#ffffff",
  hover: "rgba(15, 23, 42, 0.08)",
  active: "rgba(15, 23, 42, 0.12)",
  overlay: "rgba(9, 13, 23, 0.65)",
} as const;

const stateDark = {
  focusRing: "rgba(108, 132, 255, 0.6)",
  focusRingOffset: "#0d1726",
  hover: "rgba(236, 239, 247, 0.08)",
  active: "rgba(236, 239, 247, 0.16)",
  overlay: "rgba(1, 6, 19, 0.78)",
} as const;

const shadowsLight = {
  xs: "0 1px 2px rgba(15, 23, 42, 0.08)",
  sm: "0 2px 6px rgba(15, 23, 42, 0.1)",
  md: "0 8px 24px rgba(15, 23, 42, 0.12)",
  lg: "0 16px 40px rgba(15, 23, 42, 0.18)",
  xl: "0 30px 60px -30px rgba(15, 23, 42, 0.28)",
  focus: "0 0 0 3px rgba(74, 112, 255, 0.35)",
} as const;

const shadowsDark = {
  xs: "0 1px 1px rgba(4, 9, 19, 0.5)",
  sm: "0 6px 16px rgba(4, 9, 19, 0.45)",
  md: "0 14px 40px rgba(4, 9, 19, 0.5)",
  lg: "0 24px 64px rgba(4, 9, 19, 0.58)",
  xl: "0 42px 90px -25px rgba(2, 6, 19, 0.65)",
  focus: "0 0 0 3px rgba(108, 132, 255, 0.5)",
} as const;

const typographyTokens = {
  fontFamily: fontFamilyScale,
  fontSize: fontSizeScale,
  fontWeight: {
    regular: "var(--font-weight-regular)",
    medium: "var(--font-weight-medium)",
    semibold: "var(--font-weight-semibold)",
    bold: "var(--font-weight-bold)",
  },
} as const;

const motionTokens = {
  duration: motionDurationScale,
  easing: motionEasingScale,
} as const;

export const designTokens = {
  light: {
    colors: colorsLight,
    state: stateLight,
    spacing: spacingScale,
    radii: radiiScale,
    shadows: shadowsLight,
    typography: typographyTokens,
    motion: motionTokens,
  },
  dark: {
    colors: colorsDark,
    state: stateDark,
    spacing: spacingScale,
    radii: radiiScale,
    shadows: shadowsDark,
    typography: typographyTokens,
    motion: motionTokens,
  },
  "high-contrast": {
    // High-contrast uses dark theme with enhanced contrast
    // TODO: Create dedicated high-contrast color palette
    colors: colorsDark,
    state: stateDark,
    spacing: spacingScale,
    radii: radiiScale,
    shadows: shadowsDark,
    typography: typographyTokens,
    motion: motionTokens,
  },
} as const satisfies Record<ThemeName, unknown>;

export type ThemeDefinition = (typeof designTokens)[ThemeName];

export const resolveTheme = (mode?: ThemeName | ThemeAlias | null): ThemeName => {
  if (!mode) return "light";
  if ((themeAliases as Record<string, ThemeName>)[mode]) {
    return (themeAliases as Record<string, ThemeName>)[mode];
  }
  return themeNames.includes(mode as ThemeName) ? (mode as ThemeName) : "light";
};

export const getTheme = (mode: ThemeName | ThemeAlias = "light"): ThemeDefinition => {
  const resolved = resolveTheme(mode);
  return designTokens[resolved];
};
