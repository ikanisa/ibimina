import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, spacing, borderRadius } from "../../theme";

interface BadgeProps {
  count?: number;
  dot?: boolean;
  variant?: "primary" | "success" | "error" | "warning";
}

export const Badge: React.FC<BadgeProps> = ({ count = 0, dot = false, variant = "error" }) => {
  if (count === 0 && !dot) return null;

  const getBackgroundColor = () => {
    switch (variant) {
      case "primary":
        return colors.primary;
      case "success":
        return colors.success;
      case "error":
        return colors.error;
      case "warning":
        return colors.warning;
      default:
        return colors.error;
    }
  };

  if (dot) {
    return <View style={[styles.dot, { backgroundColor: getBackgroundColor() }]} />;
  }

  const displayCount = count > 99 ? "99+" : count.toString();

  return (
    <View style={[styles.badge, { backgroundColor: getBackgroundColor() }]}>
      <Text style={styles.count}>{displayCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
  },
  count: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: "600",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error,
  },
});
