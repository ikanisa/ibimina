import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet } from "react-native";

import { colors, layoutSpacing } from "@theme";

export function ScreenContainer({ children }: PropsWithChildren) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      accessibilityRole="summary"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: layoutSpacing.screenPadding,
    gap: layoutSpacing.stackGap,
  },
});
