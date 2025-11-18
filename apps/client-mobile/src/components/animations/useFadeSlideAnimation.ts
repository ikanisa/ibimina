import { useEffect } from "react";
import {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

interface FadeSlideOptions {
  delay?: number;
  initialOffset?: number;
  damping?: number;
}

export function useFadeSlideAnimation({
  delay = 0,
  initialOffset = 12,
  damping = 300,
}: FadeSlideOptions = {}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration: damping,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [delay, damping, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [initialOffset, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  return animatedStyle;
}
