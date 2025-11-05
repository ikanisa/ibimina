import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, typography, borderRadius, spacing, shadows } from "../../theme";

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}

export function Card({ children, onPress, style }: CardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper style={[styles.card, style]} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.md,
  },
});

// Account Card Component
interface AccountCardProps {
  account: {
    id: string;
    name: string;
    accountNumber: string;
    balance: number;
    currency: string;
  };
  onPress: () => void;
}

export function AccountCard({ account, onPress }: AccountCardProps) {
  return (
    <Card onPress={onPress} style={styles.accountCard}>
      <Text style={styles.accountName}>{account.name}</Text>
      <Text style={styles.accountNumber}>{account.accountNumber}</Text>
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>
          {account.currency} {account.balance.toLocaleString("en-RW")}
        </Text>
      </View>
    </Card>
  );
}

const accountCardStyles = StyleSheet.create({
  accountCard: {
    marginBottom: spacing.md,
  },
  accountName: {
    fontSize: typography.h4,
    fontWeight: "700",
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  accountNumber: {
    fontSize: typography.bodySmall,
    color: colors.gray500,
    marginBottom: spacing.lg,
  },
  balanceContainer: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  balanceLabel: {
    fontSize: typography.caption,
    color: colors.gray500,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    fontSize: typography.h2,
    fontWeight: "700",
    color: colors.primary,
  },
});

Object.assign(styles, accountCardStyles);
