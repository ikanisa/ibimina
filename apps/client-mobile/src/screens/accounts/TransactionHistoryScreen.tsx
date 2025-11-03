import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, typography } from "../../theme";

export function TransactionHistory({ navigation, route }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>TransactionHistory</Text>
        <Text style={styles.subtitle}>Implementation in progress...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1, padding: spacing.xl, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: typography.h2,
    fontWeight: "700",
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  subtitle: { fontSize: typography.body, color: colors.gray500 },
});
