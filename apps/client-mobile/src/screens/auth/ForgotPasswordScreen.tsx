import React, { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { TextInput } from "../../components/ui/TextInput";
import { authService } from "../../services/supabase";
import { colors, spacing, typography } from "../../theme";

export function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authService.resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.message}>We've sent password reset instructions to {email}</Text>
          <Button
            title="Back to Login"
            onPress={() => navigation.navigate("Login")}
            fullWidth
            style={{ marginTop: spacing.xl }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your email to receive reset instructions</Text>

          <TextInput
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ marginTop: spacing.xl }}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Send Reset Link"
            onPress={handleReset}
            loading={loading}
            fullWidth
            style={{ marginTop: spacing.lg }}
          />
          <Button
            title="Back to Login"
            onPress={() => navigation.navigate("Login")}
            variant="ghost"
            fullWidth
            style={{ marginTop: spacing.md }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  keyboardView: { flex: 1 },
  content: { flex: 1, padding: spacing.xl, justifyContent: "center" },
  title: {
    fontSize: typography.h1,
    fontWeight: "700",
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  subtitle: { fontSize: typography.body, color: colors.gray500, marginBottom: spacing.lg },
  message: {
    fontSize: typography.body,
    color: colors.gray600,
    textAlign: "center",
    marginTop: spacing.md,
  },
  error: { color: colors.error, fontSize: typography.bodySmall, marginTop: spacing.md },
});
