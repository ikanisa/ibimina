import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, typography, spacing, borderRadius } from "../../theme";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: "default" | "success" | "error" | "warning" | "info";
  size?: "sm" | "md";
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  variant = "default",
  size = "md",
}) => {
  const getBackgroundColor = () => {
    if (selected) return colors.primary;
    switch (variant) {
      case "success":
        return colors.successBg;
      case "error":
        return colors.errorBg;
      case "warning":
        return colors.warningBg;
      case "info":
        return colors.infoBg;
      default:
        return colors.gray100;
    }
  };

  const getTextColor = () => {
    if (selected) return colors.white;
    switch (variant) {
      case "success":
        return colors.success;
      case "error":
        return colors.error;
      case "warning":
        return colors.warning;
      case "info":
        return colors.info;
      default:
        return colors.gray700;
    }
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[
        styles.chip,
        size === "sm" && styles.chipSm,
        { backgroundColor: getBackgroundColor() },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, size === "sm" && styles.labelSm, { color: getTextColor() }]}>
        {label}
      </Text>
    </Component>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
  },
  chipSm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: typography.body,
    fontWeight: "500",
  },
  labelSm: {
    fontSize: typography.bodySmall,
  },
});
