import SkeletonPlaceholder from "react-native-skeleton-placeholder";
import { View } from "react-native";

import { colors, layoutSpacing } from "@theme";

export function LoansSkeleton() {
  return (
    <View accessibilityLabel="loans-skeleton" accessible>
      <SkeletonPlaceholder backgroundColor={colors.surfaceMuted} highlightColor={colors.surface}>
        {[0, 1].map((index) => (
          <SkeletonPlaceholder.Item
            key={`loan-${index}`}
            height={104}
            borderRadius={24}
            marginBottom={layoutSpacing.md}
          />
        ))}
      </SkeletonPlaceholder>
    </View>
  );
}
