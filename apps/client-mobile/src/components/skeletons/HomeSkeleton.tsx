import SkeletonPlaceholder from "react-native-skeleton-placeholder";
import { View } from "react-native";

import { colors, layoutSpacing } from "@theme";

export function HomeSkeleton() {
  return (
    <View accessibilityLabel="home-skeleton" accessible>
      <SkeletonPlaceholder backgroundColor={colors.surfaceMuted} highlightColor={colors.surface}>
        <SkeletonPlaceholder.Item gap={layoutSpacing.cardGap}>
          <SkeletonPlaceholder.Item height={48} width="60%" borderRadius={12} />
          <SkeletonPlaceholder.Item height={120} borderRadius={24} />
          <SkeletonPlaceholder.Item gap={layoutSpacing.cardGap}>
            {[0, 1, 2].map((index) => (
              <SkeletonPlaceholder.Item key={`quick-${index}`} height={56} borderRadius={18} />
            ))}
          </SkeletonPlaceholder.Item>
        </SkeletonPlaceholder.Item>
      </SkeletonPlaceholder>
    </View>
  );
}
