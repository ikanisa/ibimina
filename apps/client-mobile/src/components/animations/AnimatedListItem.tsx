import type { PropsWithChildren } from "react";
import Animated from "react-native-reanimated";

import { useFadeSlideAnimation } from "./useFadeSlideAnimation";

interface AnimatedListItemProps extends PropsWithChildren {
  index: number;
  delayPerItem?: number;
}

export function AnimatedListItem({ index, delayPerItem = 80, children }: AnimatedListItemProps) {
  const animatedStyle = useFadeSlideAnimation({ delay: index * delayPerItem });

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
