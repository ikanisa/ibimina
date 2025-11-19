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
import { radius, spacing, shadow } from "@theme/tokens";
import { useNativeWindTheme } from "@theme/nativewind";
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
  const theme = useNativeWindTheme();

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
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.palette.background }]}
      className={theme.classes.background}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        contentContainerClassName="gap-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header} className="gap-2">
          <Text style={styles.title} className={theme.classes.textPrimary}>
            Make a Payment
          </Text>
          <Text style={styles.subtitle} className={theme.classes.textSecondary}>
            Dial the USSD code to contribute to your group.
          </Text>
        </View>

        <View
          style={[styles.stepsCard, { borderColor: theme.palette.border }]}
          className={`${theme.classes.surface} ${theme.classes.border} ${theme.classes.cardShadow}`}
        >
          <Text style={styles.cardTitle} className={theme.classes.textPrimary}>
            How it works
          </Text>
          {PAYMENT_STEPS.map((step, index) => (
            <View key={step.title} style={styles.stepRow}>
              <View style={styles.stepBadge} className={theme.classes.surfaceMuted}>
                <Text style={styles.stepBadgeText} className={theme.classes.textPrimary}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle} className={theme.classes.textPrimary}>
                  {step.title}
                </Text>
                <Text style={styles.stepDescription} className={theme.classes.textSecondary}>
                  {step.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {MOCK_INSTRUCTIONS.map((instruction) => (
          <View
            key={instruction.id}
            style={[styles.card, { borderColor: theme.palette.border }]}
            className={`${theme.classes.surface} ${theme.classes.border} ${theme.classes.cardShadow}`}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle} className={theme.classes.textPrimary}>
                  {instruction.groupName}
                </Text>
                <Text style={styles.cardMeta} className={theme.classes.textMuted}>
                  {instruction.saccoName}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.dialButton, { backgroundColor: theme.palette.primary }]}
                onPress={() => handleDial(instruction.ussdCode)}
                accessibilityLabel={`Dial USSD code for ${instruction.groupName}`}
              >
                <Text style={styles.dialButtonLabel}>Dial to Pay</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.palette.border }]} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel} className={theme.classes.textMuted}>
                Merchant Code
              </Text>
              <TouchableOpacity
                onPress={() => handleCopy("Merchant code", instruction.merchantCode)}
                accessibilityLabel={`Copy merchant code ${instruction.merchantCode}`}
              >
                <Text style={styles.detailValue} className={theme.classes.textPrimary}>
                  {instruction.merchantCode}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel} className={theme.classes.textMuted}>
                Reference
              </Text>
              <TouchableOpacity
                onPress={() => handleCopy("Reference", instruction.reference)}
                accessibilityLabel={`Copy reference ${instruction.reference}`}
              >
                <Text style={styles.detailValue} className={theme.classes.textPrimary}>
                  {instruction.reference}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel} className={theme.classes.textMuted}>
                Amount
              </Text>
              <Text style={styles.detailValue} className={theme.classes.textPrimary}>
                {instruction.amount.toLocaleString()} RWF
              </Text>
            </View>

            <View style={[styles.ussdContainer, { backgroundColor: theme.palette.card }]}>
              <Text style={styles.ussdLabel} className={theme.classes.textMuted}>
                USSD Code
              </Text>
              <TouchableOpacity onPress={() => handleCopy("USSD code", instruction.ussdCode)}>
                <Text style={styles.ussdValue} className={theme.classes.accent}>
                  {instruction.ussdCode}
                </Text>
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
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  stepsCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    ...shadow.card,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
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
  },
  cardMeta: {
    fontSize: 13,
    marginTop: spacing.xs / 2,
  },
  dialButton: {
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
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  ussdContainer: {
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  ussdLabel: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: "uppercase" as const,
  },
  ussdValue: {
    fontSize: 16,
    fontWeight: "700",
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
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: {
    fontWeight: "700",
  },
  stepContent: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  stepDescription: {
    fontSize: 13,
    lineHeight: 20,
  },
});
