export const radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radii;

const spacingUnit = 4;

export type SpacingStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const spacingScale: Record<SpacingStep, number> = {
  0: 0,
  1: spacingUnit,
  2: spacingUnit * 2,
  3: spacingUnit * 3,
  4: spacingUnit * 4,
  5: spacingUnit * 6,
  6: spacingUnit * 8,
  7: spacingUnit * 10,
  8: spacingUnit * 12,
  9: spacingUnit * 14,
  10: spacingUnit * 16,
};

/**
 * Returns spacing based on the 4px baseline grid.
 * Accepts predefined steps or arbitrary multipliers for finer control.
 */
export function spacing(step: SpacingStep | number): number {
  if (step in spacingScale) {
    return spacingScale[step as SpacingStep];
  }

  return step * spacingUnit;
}

export interface ShadowPreset {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export const shadowPresets: Record<"glass" | "raised" | "floating", ShadowPreset> = {
  glass: {
    shadowColor: "rgba(11, 16, 32, 0.28)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  raised: {
    shadowColor: "rgba(11, 16, 32, 0.35)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  floating: {
    shadowColor: "rgba(11, 16, 32, 0.3)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 16,
  },
};

export type ShadowPresetName = keyof typeof shadowPresets;
