import React, { useCallback } from "react";
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ImpactStyle } from "@capacitor/haptics";
import { colors, radius, spacing, shadow } from "@theme/tokens";
import { IconBadge } from "@components/IconBadge";
import { StatusChip } from "@components/StatusChip";
import { copyToClipboard, triggerHaptic } from "@utils/native";

interface ContactDetail {
  id: string;
  label: string;
  value: string;
  icon: string;
  actionLabel: string;
  url: string;
}

const CONTACT_DETAILS: ContactDetail[] = [
  {
    id: "phone",
    label: "Phone",
    value: "+250 788 123 456",
    icon: "📞",
    actionLabel: "Call",
    url: "tel:+250788123456",
  },
  {
    id: "email",
    label: "Email",
    value: "support@ibimina.rw",
    icon: "✉️",
    actionLabel: "Email",
    url: "mailto:support@ibimina.rw",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    value: "+250 722 555 222",
    icon: "💬",
    actionLabel: "Chat",
    url: "https://wa.me/250722555222",
  },
];

const LANGUAGES = [
  { id: "en", label: "English", primary: true },
  { id: "rw", label: "Kinyarwanda", primary: true },
  { id: "fr", label: "Français", primary: false },
];

const SUPPORT_ACTIONS = [
  {
    id: "ticket",
    title: "Open a support ticket",
    description: "Chat with our support team in under 10 minutes.",
    url: "https://ibimina.rw/support",
  },
  {
    id: "whatsapp",
    title: "Message us on WhatsApp",
    description: "Monday - Saturday, 8:00 to 20:00 CAT.",
    url: "https://wa.me/250722555222",
  },
];

const LEGAL_LINKS = [
  {
    id: "terms",
    title: "Terms & Conditions",
    url: "https://ibimina.rw/terms",
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    url: "https://ibimina.rw/privacy",
  },
];

function LanguageChip({ label, primary }: { label: string; primary?: boolean }) {
  const containerStyle = primary
    ? [styles.languageChip, styles.languageChipActive]
    : [styles.languageChip];
  const labelStyle = primary
    ? [styles.languageLabel, styles.languageLabelActive]
    : [styles.languageLabel];

  return (
    <View style={containerStyle}>
      <Text style={labelStyle}>{label}</Text>
    </View>
  );
}

export function ProfileScreen() {
  const handleOpenUrl = useCallback(async (url: string) => {
    const supported = await Linking.canOpenURL(url).catch(() => false);
    if (supported) {
      await Linking.openURL(url);
      await triggerHaptic(ImpactStyle.Light);
    } else {
      Alert.alert("Unavailable", "We couldn't open this link. Please try again later.");
    }
  }, []);

  const handleCopy = useCallback(async (label: string, value: string) => {
    const copied = await copyToClipboard(value);
    await triggerHaptic(ImpactStyle.Light);
    if (copied) {
      Alert.alert("Copied", `${label} copied to clipboard.`);
    } else {
      Alert.alert("Clipboard unavailable", "Please copy this value manually: " + value);
    }
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Your Profile</Text>
            <Text style={styles.subtitle}>Manage your contact details and preferences.</Text>
          </View>
          <StatusChip label="Verified Member" tone="success" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact information</Text>
          {CONTACT_DETAILS.map((detail) => (
            <View key={detail.id} style={styles.contactRow}>
              <IconBadge symbol={detail.icon} />
              <View style={styles.contactBody}>
                <Text style={styles.contactLabel}>{detail.label}</Text>
                <Text style={styles.contactValue}>{detail.value}</Text>
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={styles.primaryAction}
                  onPress={() => handleOpenUrl(detail.url)}
                  accessibilityLabel={`${detail.actionLabel} ${detail.label}`}
                >
                  <Text style={styles.primaryActionLabel}>{detail.actionLabel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryAction}
                  onPress={() => handleCopy(detail.label, detail.value)}
                  accessibilityLabel={`Copy ${detail.label}`}
                >
                  <Text style={styles.secondaryActionLabel}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preferred languages</Text>
          <View style={styles.languageRow}>
            {LANGUAGES.map((language) => (
              <LanguageChip key={language.id} label={language.label} primary={language.primary} />
            ))}
          </View>
          <Text style={styles.languageHint}>
            Switching languages syncs across all your Ibimina devices.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Support</Text>
          {SUPPORT_ACTIONS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.listRow}
              onPress={() => handleOpenUrl(item.url)}
              accessibilityLabel={item.title}
            >
              <View style={styles.listRowBody}>
                <Text style={styles.listRowTitle}>{item.title}</Text>
                <Text style={styles.listRowDescription}>{item.description}</Text>
              </View>
              <Text style={styles.listRowChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Legal</Text>
          {LEGAL_LINKS.map((link) => (
            <TouchableOpacity
              key={link.id}
              style={styles.listRow}
              onPress={() => handleOpenUrl(link.url)}
              accessibilityLabel={link.title}
            >
              <View style={styles.listRowBody}>
                <Text style={styles.listRowTitle}>{link.title}</Text>
                <Text style={styles.listRowDescription}>Updated December 2024</Text>
              </View>
              <Text style={styles.listRowChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  contactBody: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  contactLabel: {
    fontSize: 13,
    color: colors.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  contactActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginLeft: spacing.sm,
  },
  primaryAction: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  primaryActionLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  secondaryAction: {
    backgroundColor: colors.surfaceMuted,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  secondaryActionLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  languageRow: {
    flexDirection: "row",
    flexWrap: "wrap" as const,
    gap: spacing.sm,
  },
  languageChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  languageChipActive: {
    backgroundColor: colors.primary,
    borderColor: "transparent",
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  languageLabelActive: {
    color: "#FFFFFF",
  },
  languageHint: {
    fontSize: 13,
    color: colors.textMuted,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listRowBody: {
    flex: 1,
    gap: spacing.xs / 2,
    paddingRight: spacing.sm,
  },
  listRowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  listRowDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  listRowChevron: {
    fontSize: 24,
    color: colors.textMuted,
  },
});
