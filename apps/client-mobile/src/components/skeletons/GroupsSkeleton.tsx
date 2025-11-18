import SkeletonPlaceholder from "react-native-skeleton-placeholder";
import { View } from "react-native";

import { colors, layoutSpacing } from "@theme";

export function GroupsSkeleton() {
  return (
    <View accessibilityLabel="groups-skeleton" accessible>
      <SkeletonPlaceholder backgroundColor={colors.surfaceMuted} highlightColor={colors.surface}>
        {[0, 1, 2].map((index) => (
          <SkeletonPlaceholder.Item
            key={`group-${index}`}
            height={92}
            borderRadius={24}
            marginBottom={layoutSpacing.md}
          />
        ))}
      </SkeletonPlaceholder>
    </View>
  );
}
