import type { PropsWithChildren } from "react";
import Animated from "react-native-reanimated";

import { useFadeSlideAnimation } from "./useFadeSlideAnimation";

interface AnimatedScreenWrapperProps extends PropsWithChildren {
  delay?: number;
}

export function AnimatedScreenWrapper({ delay = 0, children }: AnimatedScreenWrapperProps) {
  const animatedStyle = useFadeSlideAnimation({ delay, initialOffset: 18 });
  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
