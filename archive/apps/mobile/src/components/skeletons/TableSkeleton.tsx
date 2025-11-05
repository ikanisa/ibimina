import { memo } from "react";
import { Animated, StyleSheet, View } from "react-native";

const pulse = new Animated.Value(0);
Animated.loop(
  Animated.sequence([
    Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
    Animated.timing(pulse, { toValue: 0, duration: 1400, useNativeDriver: true }),
  ])
).start();

const TableSkeletonComponent = () => {
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.6] });

  return (
    <View style={styles.container}>
      {Array.from({ length: 4 }).map((_, idx) => (
        <Animated.View key={idx} style={[styles.row, { opacity }]}>
          <View style={styles.linePrimary} />
          <View style={styles.lineSecondary} />
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingVertical: 12,
  },
  row: {
    gap: 8,
  },
  linePrimary: {
    height: 16,
    width: "70%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  lineSecondary: {
    height: 12,
    width: "45%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});

export const TableSkeleton = memo(TableSkeletonComponent);
