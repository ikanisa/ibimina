import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useOnboarding } from "../hooks/useOnboarding";

const languages = [
  { code: "rw", label: "Kinyarwanda" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

export const OnboardingFlow = () => {
  const { step, languageMutation, contactMutation, pickKycMutation, kycImage } = useOnboarding();
  const [whatsapp, setWhatsapp] = useState("");
  const [momo, setMomo] = useState("");

  const languageButtons = useMemo(
    () =>
      languages.map((language) => (
        <Pressable
          key={language.code}
          style={({ pressed }) => [styles.languageButton, pressed && styles.languageButtonPressed]}
          onPress={async () => {
            await Haptics.selectionAsync();
            languageMutation.mutate(language.code);
          }}
        >
          <Text style={styles.languageText}>{language.label}</Text>
        </Pressable>
      )),
    [languageMutation]
  );

  if (step === "language") {
    return (
      <LinearGradient colors={["#0b122d", "#101a3b"]} style={styles.screen}>
        <Text style={styles.heading}>Choose your language</Text>
        <Text style={styles.body}>
          We’ll translate menus, alerts, and help around your preference.
        </Text>
        <View style={styles.languageGrid}>{languageButtons}</View>
      </LinearGradient>
    );
  }

  if (step === "contacts") {
    return (
      <LinearGradient colors={["#0b122d", "#101a3b"]} style={styles.screen}>
        <Text style={styles.heading}>Share your contact numbers</Text>
        <Text style={styles.body}>
          We use them for WhatsApp updates and to match MoMo transactions.
        </Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>WhatsApp number</Text>
          <TextInput
            style={styles.input}
            placeholder="2507..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            keyboardType="phone-pad"
            value={whatsapp}
            onChangeText={setWhatsapp}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>MoMo number</Text>
          <TextInput
            style={styles.input}
            placeholder="2507..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            keyboardType="phone-pad"
            value={momo}
            onChangeText={setMomo}
          />
        </View>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            contactMutation.mutate({ whatsapp, momo });
          }}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>
      </LinearGradient>
    );
  }

  if (step === "kyc") {
    return (
      <LinearGradient colors={["#0b122d", "#101a3b"]} style={styles.screen}>
        <Text style={styles.heading}>Upload optional KYC</Text>
        <Text style={styles.body}>
          Snap your ID card to speed up approvals. We hash it locally before sending.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          onPress={() => pickKycMutation.mutate()}
        >
          <Text style={styles.primaryButtonText}>Select photo</Text>
        </Pressable>
        {kycImage && <Text style={styles.helperText}>Image saved securely.</Text>}
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
          ]}
          onPress={() => pickKycMutation.mutateAsync().catch(() => {})}
        >
          <Text style={styles.secondaryText}>Skip for now</Text>
        </Pressable>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0b122d", "#101a3b"]} style={styles.screen}>
      <Text style={styles.heading}>All set!</Text>
      <Text style={styles.body}>
        Thanks for confirming your details. You can adjust them anytime in settings.
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  heading: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
  },
  body: {
    marginTop: 12,
    color: "rgba(232,237,255,0.75)",
    fontSize: 16,
    lineHeight: 22,
  },
  languageGrid: {
    marginTop: 32,
    gap: 12,
  },
  languageButton: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(98,118,220,0.16)",
    borderWidth: 1,
    borderColor: "rgba(142,166,255,0.38)",
  },
  languageButtonPressed: {
    backgroundColor: "rgba(142,166,255,0.3)",
  },
  languageText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  formGroup: {
    marginTop: 20,
  },
  label: {
    color: "rgba(220,230,255,0.7)",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(16,24,54,0.7)",
    borderRadius: 16,
    padding: 14,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(120,146,250,0.25)",
  },
  primaryButton: {
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "rgba(126,149,255,0.9)",
    alignItems: "center",
  },
  primaryButtonPressed: {
    backgroundColor: "rgba(126,149,255,1)",
  },
  primaryButtonText: {
    color: "#040717",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 18,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  secondaryButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  secondaryText: {
    color: "rgba(232,237,255,0.8)",
  },
  helperText: {
    marginTop: 12,
    color: "rgba(200,220,255,0.75)",
  },
});
