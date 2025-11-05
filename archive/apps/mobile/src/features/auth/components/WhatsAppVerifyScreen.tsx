import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useAppStore } from "../../../providers/store";
import { saveAuthToken } from "../../../storage/authToken";
import { startWhatsAppAuth, verifyWhatsAppAuth } from "../api";

const DEFAULT_RESEND_SECONDS = 60;

export interface WhatsAppVerifyScreenProps {
  whatsappNumber: string;
  attemptId: string;
  initialResendIn?: number;
  onVerified?: () => void;
}

export function WhatsAppVerifyScreen({
  whatsappNumber,
  attemptId,
  initialResendIn,
  onVerified,
}: WhatsAppVerifyScreenProps) {
  const [code, setCode] = useState("");
  const [currentAttemptId, setCurrentAttemptId] = useState(attemptId);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(
    Math.max(initialResendIn ?? DEFAULT_RESEND_SECONDS, 0)
  );
  const setAuthToken = useAppStore((state) => state.setAuthToken);

  useEffect(() => {
    setResendCountdown(Math.max(initialResendIn ?? DEFAULT_RESEND_SECONDS, 0));
    setCurrentAttemptId(attemptId);
  }, [attemptId, initialResendIn]);

  useEffect(() => {
    if (resendCountdown <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setResendCountdown((seconds) => Math.max(seconds - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const formattedCountdown = useMemo(() => {
    const minutes = Math.floor(resendCountdown / 60);
    const seconds = resendCountdown % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [resendCountdown]);

  const verify = useCallback(async () => {
    if (!code.trim() || isVerifying) {
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);
      const response = await verifyWhatsAppAuth(whatsappNumber, code, currentAttemptId);
      await saveAuthToken(response.token);
      setAuthToken(response.token);
      onVerified?.();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Verification failed. Please try again.");
      }
    } finally {
      setIsVerifying(false);
    }
  }, [code, isVerifying, whatsappNumber, currentAttemptId, onVerified, setAuthToken]);

  const resend = useCallback(async () => {
    if (resendCountdown > 0 || isResending) {
      return;
    }
    try {
      setIsResending(true);
      setError(null);
      const response = await startWhatsAppAuth(whatsappNumber);
      setCurrentAttemptId(response.attemptId);
      setResendCountdown(Math.max(response.resendIn ?? DEFAULT_RESEND_SECONDS, 0));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Could not resend the code. Please try again shortly.");
      }
    } finally {
      setIsResending(false);
    }
  }, [isResending, resendCountdown, whatsappNumber]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Check your WhatsApp</Text>
      <Text style={styles.subtitle}>
        We sent a 6-digit code to {whatsappNumber}. Enter it below to continue.
      </Text>

      <Text style={styles.label}>One-time code</Text>
      <TextInput
        accessibilityLabel="Verification code"
        keyboardType="number-pad"
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder="••••••"
        placeholderTextColor="rgba(255,255,255,0.4)"
        maxLength={6}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !code.trim() || isVerifying }}
        onPress={verify}
        style={({ pressed }) => [
          styles.primaryButton,
          (!code.trim() || isVerifying) && styles.disabledButton,
          pressed && code.trim() && !isVerifying ? styles.primaryButtonPressed : null,
        ]}
        disabled={!code.trim() || isVerifying}
      >
        {isVerifying ? (
          <ActivityIndicator color="#040717" />
        ) : (
          <Text style={styles.primaryButtonText}>Verify and continue</Text>
        )}
      </Pressable>

      <View style={styles.resendContainer}>
        <Text style={styles.helperText}>Didn't receive it?</Text>
        <Pressable
          accessibilityRole="button"
          onPress={resend}
          accessibilityState={{ disabled: resendCountdown > 0 || isResending }}
          style={({ pressed }) => [
            styles.link,
            (resendCountdown > 0 || isResending) && styles.disabledLink,
            pressed && resendCountdown <= 0 && !isResending ? styles.linkPressed : null,
          ]}
          disabled={resendCountdown > 0 || isResending}
        >
          {isResending ? (
            <ActivityIndicator color="#7e95ff" />
          ) : (
            <Text style={styles.linkText}>
              {resendCountdown > 0 ? `Resend available in ${formattedCountdown}` : "Resend code"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b122d",
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: "center",
  },
  heading: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(232,237,255,0.75)",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 32,
  },
  label: {
    color: "rgba(220,230,255,0.7)",
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    backgroundColor: "rgba(16,24,54,0.7)",
    borderRadius: 16,
    padding: 16,
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(120,146,250,0.25)",
    fontSize: 18,
    letterSpacing: 12,
    textAlign: "center",
    marginBottom: 16,
  },
  error: {
    color: "#ff9ca0",
    marginBottom: 16,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: "rgba(126,149,255,0.9)",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "rgba(126,149,255,0.3)",
  },
  primaryButtonPressed: {
    backgroundColor: "rgba(126,149,255,1)",
  },
  primaryButtonText: {
    color: "#040717",
    fontWeight: "700",
    fontSize: 16,
  },
  resendContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  helperText: {
    color: "rgba(220,230,255,0.7)",
    marginBottom: 8,
  },
  link: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  disabledLink: {
    opacity: 0.6,
  },
  linkPressed: {
    backgroundColor: "rgba(126,149,255,0.1)",
  },
  linkText: {
    color: "#7e95ff",
    fontWeight: "600",
  },
});
