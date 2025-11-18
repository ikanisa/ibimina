import SkeletonPlaceholder from "react-native-skeleton-placeholder";
import { View } from "react-native";

import { colors, layoutSpacing } from "@theme";

export function AccountsSkeleton() {
  return (
    <View accessibilityLabel="accounts-skeleton" accessible>
      <SkeletonPlaceholder backgroundColor={colors.surfaceMuted} highlightColor={colors.surface}>
        {[0, 1, 2, 3].map((index) => (
          <SkeletonPlaceholder.Item
            key={`txn-${index}`}
            height={72}
            borderRadius={18}
            marginBottom={layoutSpacing.listItemGap}
          />
        ))}
      </SkeletonPlaceholder>
    </View>
  );
}
