import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, layoutSpacing } from "@theme";

interface SectionHeaderProps extends PropsWithChildren {
  title: string;
  description?: string;
}

export function SectionHeader({ title, description, children }: SectionHeaderProps) {
  return (
    <View style={styles.container} accessibilityRole="header">
      <View style={styles.copyWrapper}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: layoutSpacing.cardGap,
  },
  copyWrapper: {
    flexShrink: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  description: {
    marginTop: 2,
    color: colors.textSecondary,
  },
});
