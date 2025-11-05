import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { startWhatsAppAuth } from "../api";

const MIN_PHONE_LENGTH = 10;

export interface WhatsAppStartScreenProps {
  defaultWhatsappNumber?: string;
  onCodeSent: (params: {
    whatsappNumber: string;
    attemptId: string;
    expiresIn: number;
    resendIn?: number;
  }) => void;
}

export function WhatsAppStartScreen({
  defaultWhatsappNumber = "",
  onCodeSent,
}: WhatsAppStartScreenProps) {
  const [whatsappNumber, setWhatsappNumber] = useState(defaultWhatsappNumber);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedNumber = useMemo(() => whatsappNumber.trim(), [whatsappNumber]);
  const isValid = trimmedNumber.length >= MIN_PHONE_LENGTH;

  const submit = useCallback(async () => {
    if (!isValid || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const response = await startWhatsAppAuth(trimmedNumber);
      onCodeSent({
        whatsappNumber: trimmedNumber,
        attemptId: response.attemptId,
        expiresIn: response.expiresIn,
        resendIn: response.resendIn,
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [isValid, isSubmitting, trimmedNumber, onCodeSent]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Sign in with WhatsApp</Text>
      <Text style={styles.subtitle}>
        Enter the WhatsApp number linked to your Ibimina account. We’ll send a secure code to verify
        it belongs to you.
      </Text>

      <Text style={styles.label}>WhatsApp number</Text>
      <TextInput
        accessibilityLabel="WhatsApp number"
        keyboardType="phone-pad"
        autoComplete="tel"
        autoCapitalize="none"
        style={styles.input}
        value={whatsappNumber}
        onChangeText={setWhatsappNumber}
        placeholder="2507..."
        placeholderTextColor="rgba(255,255,255,0.4)"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !isValid || isSubmitting }}
        onPress={submit}
        style={({ pressed }) => [
          styles.primaryButton,
          (!isValid || isSubmitting) && styles.disabledButton,
          pressed && isValid && !isSubmitting ? styles.primaryButtonPressed : null,
        ]}
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#040717" />
        ) : (
          <Text style={styles.primaryButtonText}>Send code</Text>
        )}
      </Pressable>
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
    fontSize: 16,
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
});
