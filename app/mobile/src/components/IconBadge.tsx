import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { colors, radius, spacing } from "@theme/tokens";

interface IconBadgeProps {
  symbol: string;
}

export function IconBadge({ symbol }: IconBadgeProps) {
  return (
    <View style={styles.container} accessibilityElementsHidden accessibilityLabel={symbol}>
      <Text style={styles.symbol}>{symbol}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceTinted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  symbol: {
    fontSize: 18,
  },
});
