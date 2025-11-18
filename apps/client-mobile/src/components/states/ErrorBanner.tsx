import { StyleSheet, Text, View } from "react-native";

import { AnimatedPressableButton } from "@components/animations/AnimatedPressable";
import { useFadeSlideAnimation } from "@components/animations/useFadeSlideAnimation";
import Animated from "react-native-reanimated";
import { colors, layoutSpacing } from "@theme";

interface ErrorBannerProps {
  message: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function ErrorBanner({ message, actionLabel, onActionPress }: ErrorBannerProps) {
  const animatedStyle = useFadeSlideAnimation({ initialOffset: -16 });
  return (
    <Animated.View style={[styles.container, animatedStyle]} accessibilityLiveRegion="polite">
      <View style={styles.copyBlock}>
        <Text style={styles.title}>⚠️</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      {actionLabel && onActionPress ? (
        <AnimatedPressableButton variant="secondary" onPress={onActionPress}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </AnimatedPressableButton>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.dangerMuted,
    borderRadius: 18,
    padding: layoutSpacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.danger,
    gap: layoutSpacing.cardGap,
  },
  copyBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: layoutSpacing.listItemGap,
  },
  title: {
    fontSize: 18,
  },
  message: {
    flex: 1,
    color: colors.danger,
    fontWeight: "600",
  },
  actionLabel: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
});
