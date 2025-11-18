export const spacing = {
  none: 0,
  xxxs: 2,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const layoutSpacing = {
  screenPadding: spacing.xl,
  headerSpacing: spacing.md,
  cardPadding: spacing.lg,
  cardGap: spacing.sm,
  listItemGap: spacing.xs,
  stackGap: spacing.md,
  buttonPaddingVertical: 16,
  buttonPaddingHorizontal: 24,
};

export type SpacingKey = keyof typeof spacing;
export const getSpacing = (key: SpacingKey): number => spacing[key];
