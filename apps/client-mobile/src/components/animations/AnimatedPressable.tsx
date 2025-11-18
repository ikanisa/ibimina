import type { PropsWithChildren } from "react";
import { Pressable, type PressableProps, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { colors, layoutSpacing } from "@theme";

interface AnimatedPressableProps extends PressableProps {
  variant?: "primary" | "secondary";
}

const AnimatedPressableView = Animated.createAnimatedComponent(Pressable);

export function AnimatedPressableButton({
  variant = "primary",
  children,
  style,
  ...props
}: PropsWithChildren<AnimatedPressableProps>) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressableView
      {...props}
      onPressIn={(event) => {
        scale.value = withTiming(0.96, { duration: 120 });
        props.onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withTiming(1, { duration: 180 });
        props.onPressOut?.(event);
      }}
      style={[variant === "primary" ? styles.primary : styles.secondary, style, animatedStyle]}
    >
      {children}
    </AnimatedPressableView>
  );
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: colors.accent,
    paddingVertical: layoutSpacing.buttonPaddingVertical,
    paddingHorizontal: layoutSpacing.buttonPaddingHorizontal,
    borderRadius: 999,
  },
  secondary: {
    backgroundColor: colors.surface,
    paddingVertical: layoutSpacing.buttonPaddingVertical,
    paddingHorizontal: layoutSpacing.buttonPaddingHorizontal,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
