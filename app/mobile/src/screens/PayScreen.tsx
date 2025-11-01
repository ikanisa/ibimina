import React, { useCallback } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ImpactStyle } from "@capacitor/haptics";
import { colors, radius, spacing, shadow } from "@theme/tokens";
import { copyToClipboard, dialUssd, triggerHaptic } from "@utils/native";

interface PaymentInstruction {
  id: string;
  groupName: string;
  saccoName: string;
  merchantCode: string;
  reference: string;
  amount: number;
  ussdCode: string;
}

const PAYMENT_STEPS = [
  {
    title: "Dial the code",
    description: "Tap the green button to dial the USSD code automatically.",
  },
  {
    title: "Confirm merchant",
    description: "Verify the SACCO name and enter the contribution amount.",
  },
  {
    title: "Enter reference",
    description: "Use the provided reference so your contribution is tracked instantly.",
  },
];

const MOCK_INSTRUCTIONS: PaymentInstruction[] = [
  {
    id: "1",
    groupName: "Kigali Business Group",
    saccoName: "Gasabo SACCO",
    merchantCode: "123456",
    reference: "NYA.GAS.KBG.001",
    amount: 20000,
    ussdCode: "*182*8*1*123456*20000#",
  },
  {
    id: "2",
    groupName: "Farmers Cooperative",
    saccoName: "Kicukiro SACCO",
    merchantCode: "789012",
    reference: "NYA.KIC.FRM.002",
    amount: 15000,
    ussdCode: "*182*8*1*789012*15000#",
  },
];

export function PayScreen() {
  const handleCopy = useCallback(async (label: string, value: string) => {
    const copied = await copyToClipboard(value);
    await triggerHaptic(ImpactStyle.Light);

    if (copied) {
      Alert.alert("Copied", `${label} copied to clipboard.`);
    } else {
      Alert.alert("Clipboard unavailable", "Please copy this value manually: " + value);
    }
  }, []);

  const handleDial = useCallback(async (ussdCode: string) => {
    await triggerHaptic(ImpactStyle.Medium);

    await dialUssd(ussdCode);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Make a Payment</Text>
          <Text style={styles.subtitle}>Dial the USSD code to contribute to your group.</Text>
        </View>

        <View style={styles.stepsCard}>
          <Text style={styles.cardTitle}>How it works</Text>
          {PAYMENT_STEPS.map((step, index) => (
            <View key={step.title} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{index + 1}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {MOCK_INSTRUCTIONS.map((instruction) => (
          <View key={instruction.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>{instruction.groupName}</Text>
                <Text style={styles.cardMeta}>{instruction.saccoName}</Text>
              </View>
              <TouchableOpacity
                style={styles.dialButton}
                onPress={() => handleDial(instruction.ussdCode)}
                accessibilityLabel={`Dial USSD code for ${instruction.groupName}`}
              >
                <Text style={styles.dialButtonLabel}>Dial to Pay</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Merchant Code</Text>
              <TouchableOpacity
                onPress={() => handleCopy("Merchant code", instruction.merchantCode)}
              >
                <Text style={styles.detailValue}>{instruction.merchantCode}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reference</Text>
              <TouchableOpacity onPress={() => handleCopy("Reference", instruction.reference)}>
                <Text style={styles.detailValue}>{instruction.reference}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>{instruction.amount.toLocaleString()} RWF</Text>
            </View>

            <View style={styles.ussdContainer}>
              <Text style={styles.ussdLabel}>USSD Code</Text>
              <TouchableOpacity onPress={() => handleCopy("USSD code", instruction.ussdCode)}>
                <Text style={styles.ussdValue}>{instruction.ussdCode}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadow.card,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cardMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs / 2,
  },
  dialButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  dialButtonLabel: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  ussdContainer: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  ussdLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: "uppercase" as const,
  },
  ussdValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  stepRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: {
    color: colors.primary,
    fontWeight: "700",
  },
  stepContent: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  stepDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
