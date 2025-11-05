import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { colors, typography, spacing, borderRadius } from "../../theme";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "📭",
  title,
  description,
  actionLabel,
  onAction,
  illustration,
}) => {
  return (
    <View style={styles.container}>
      {illustration ? (
        <Image source={illustration} style={styles.illustration} resizeMode="contain" />
      ) : (
        <Text style={styles.icon}>{icon}</Text>
      )}

      <Text style={styles.title}>{title}</Text>

      {description && <Text style={styles.description}>{description}</Text>}

      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="primary" style={styles.action} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  illustration: {
    width: 200,
    height: 200,
    marginBottom: spacing.xl,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.h3,
    fontWeight: "600",
    color: colors.gray900,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.body,
    color: colors.gray600,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  action: {
    marginTop: spacing.md,
    minWidth: 200,
  },
});
