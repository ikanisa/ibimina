import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { colors, radius, spacing } from "@theme/tokens";

type StatusTone = "success" | "warning" | "info" | "neutral";

interface StatusChipProps {
  label: string;
  tone?: StatusTone;
}

const toneStyles: Record<StatusTone, { backgroundColor: string; textColor: string }> = {
  success: { backgroundColor: "rgba(22, 163, 74, 0.12)", textColor: colors.success },
  warning: { backgroundColor: "rgba(245, 158, 11, 0.12)", textColor: colors.warning },
  info: { backgroundColor: "rgba(37, 99, 235, 0.12)", textColor: colors.info },
  neutral: { backgroundColor: colors.surfaceMuted, textColor: colors.textSecondary },
};

export function StatusChip({ label, tone = "neutral" }: StatusChipProps) {
  const palette = toneStyles[tone];

  return (
    <View
      style={[styles.container, { backgroundColor: palette.backgroundColor }]}
      accessibilityRole="text"
    >
      <Text style={[styles.label, { color: palette.textColor }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.sm,
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase" as const,
  },
});
