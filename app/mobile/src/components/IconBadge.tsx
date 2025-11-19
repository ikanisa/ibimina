import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { radius, spacing } from "@theme/tokens";
import { useNativeWindTheme } from "@theme/nativewind";

interface IconBadgeProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label?: string;
}

export function IconBadge({ icon, label }: IconBadgeProps) {
  const theme = useNativeWindTheme();

  return (
    <View
      style={styles.container}
      className={`${theme.classes.surfaceTinted} ${theme.classes.border}`}
      accessibilityRole="image"
      accessibilityLabel={label ?? icon}
    >
      <Ionicons
        name={icon}
        size={20}
        color={theme.palette.primaryAlt}
        accessibilityElementsHidden
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
});
