import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { colors, borderRadius, spacing } from "../../theme";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 20,
  borderRadius: radius = borderRadius.sm,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: radius,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const TransactionSkeleton: React.FC = () => (
  <View style={styles.transactionSkeleton}>
    <View style={styles.transactionLeft}>
      <Skeleton width={40} height={40} borderRadius={borderRadius.full} />
      <View style={styles.transactionInfo}>
        <Skeleton width={120} height={16} style={{ marginBottom: spacing.xs }} />
        <Skeleton width={80} height={12} />
      </View>
    </View>
    <View style={styles.transactionRight}>
      <Skeleton width={80} height={18} style={{ marginBottom: spacing.xs }} />
      <Skeleton width={60} height={12} />
    </View>
  </View>
);

export const CardSkeleton: React.FC = () => (
  <View style={styles.cardSkeleton}>
    <Skeleton width="40%" height={14} style={{ marginBottom: spacing.sm }} />
    <Skeleton width="60%" height={32} style={{ marginBottom: spacing.md }} />
    <View style={styles.cardFooter}>
      <Skeleton width="30%" height={12} />
      <Skeleton width="30%" height={12} />
    </View>
  </View>
);

export const AccountSkeleton: React.FC = () => (
  <View style={styles.accountSkeleton}>
    <Skeleton width={48} height={48} borderRadius={borderRadius.md} />
    <View style={styles.accountInfo}>
      <Skeleton width="60%" height={16} style={{ marginBottom: spacing.xs }} />
      <Skeleton width="40%" height={12} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.gray200,
  },
  transactionSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transactionInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  cardSkeleton: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  accountSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  accountInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
});
