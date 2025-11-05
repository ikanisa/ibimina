import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, spacing } from "../../theme";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {onRetry && (
        <Button title={retryLabel} onPress={onRetry} variant="secondary" style={styles.button} />
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
  icon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.h3,
    fontWeight: "600",
    color: colors.gray900,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  message: {
    fontSize: typography.body,
    color: colors.gray600,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.md,
    minWidth: 200,
  },
});
