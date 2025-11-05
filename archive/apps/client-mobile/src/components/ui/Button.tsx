import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { colors, typography, borderRadius, spacing } from "../../theme";
import { haptics } from "../../utils/haptics";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const buttonStyle: ViewStyle[] = [
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    fullWidth && styles.buttonFullWidth,
    disabled && styles.buttonDisabled,
    style,
  ];

  const textStyle: TextStyle[] = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
    disabled && styles.textDisabled,
  ];

  const handlePress = () => {
    haptics.impact("light");
    onPress();
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.white : colors.primary} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  buttonFullWidth: {
    width: "100%",
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Variants
  button_primary: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  button_secondary: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
  },
  button_outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
  },
  button_ghost: {
    backgroundColor: "transparent",
  },

  // Sizes
  button_sm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 36,
  },
  button_md: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  button_lg: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    minHeight: 56,
  },

  // Text styles
  text: {
    fontWeight: "600",
  },
  text_primary: {
    color: colors.white,
  },
  text_secondary: {
    color: colors.gray900,
  },
  text_outline: {
    color: colors.gray900,
  },
  text_ghost: {
    color: colors.primary,
  },
  text_sm: {
    fontSize: typography.bodySmall,
  },
  text_md: {
    fontSize: typography.body,
  },
  text_lg: {
    fontSize: typography.h4,
  },
  textDisabled: {
    opacity: 0.5,
  },
});
