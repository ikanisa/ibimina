import React from "react";
import { View, StyleSheet } from "react-native";
import { colors, spacing } from "../../theme";

interface DividerProps {
  spacing?: "none" | "sm" | "md" | "lg";
}

export const Divider: React.FC<DividerProps> = ({ spacing: spacingSize = "md" }) => {
  const getMargin = () => {
    switch (spacingSize) {
      case "none":
        return 0;
      case "sm":
        return spacing.sm;
      case "md":
        return spacing.md;
      case "lg":
        return spacing.lg;
      default:
        return spacing.md;
    }
  };

  return <View style={[styles.divider, { marginVertical: getMargin() }]} />;
};

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
  },
});
