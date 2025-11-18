import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { colors, layoutSpacing } from "@theme";
import { AnimatedPressableButton } from "@components/animations/AnimatedPressable";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  children?: PropsWithChildren["children"];
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onActionPress,
  children,
}: EmptyStateProps) {
  return (
    <View style={styles.container} accessibilityRole="summary">
      <Svg width={144} height={120} viewBox="0 0 144 120" style={styles.illustration}>
        <Circle cx={72} cy={72} r={40} fill={colors.accentMuted} />
        <Circle cx={72} cy={48} r={20} fill={colors.surface} />
        <Path
          d="M40 96C56 80 88 80 104 96"
          stroke={colors.accent}
          strokeWidth={4}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {children}
      {actionLabel && onActionPress ? (
        <AnimatedPressableButton accessibilityRole="button" onPress={onActionPress}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </AnimatedPressableButton>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: layoutSpacing.xxl,
    paddingHorizontal: layoutSpacing.screenPadding,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    gap: layoutSpacing.cardGap,
  },
  illustration: {
    marginBottom: layoutSpacing.cardGap,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
  description: {
    color: colors.textSecondary,
    textAlign: "center",
  },
  actionLabel: {
    color: colors.surface,
    fontWeight: "600",
    textAlign: "center",
  },
});
