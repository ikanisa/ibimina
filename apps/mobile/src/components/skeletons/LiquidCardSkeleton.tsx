import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { Animated, StyleSheet, View } from "react-native";

const pulse = new Animated.Value(0);
Animated.loop(
  Animated.sequence([
    Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }),
    Animated.timing(pulse, { toValue: 0, duration: 1600, useNativeDriver: true }),
  ])
).start();

const LiquidCardSkeletonComponent = () => {
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });

  return (
    <LinearGradient
      colors={["rgba(16,24,56,0.75)", "rgba(18,30,70,0.55)"]}
      style={styles.container}
      accessible={true}
      accessibilityLabel="Loading group information"
      accessibilityRole="progressbar"
    >
      <Animated.View style={[styles.shimmer, { opacity }]}>
        <View style={styles.lineShort} />
        <View style={styles.lineLong} />
        <View style={styles.lineShorter} />
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    marginBottom: 16,
  },
  shimmer: {
    gap: 12,
  },
  lineShort: {
    height: 18,
    width: "55%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  lineLong: {
    height: 14,
    width: "90%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  lineShorter: {
    height: 14,
    width: "70%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});

export const LiquidCardSkeleton = memo(LiquidCardSkeletonComponent);
