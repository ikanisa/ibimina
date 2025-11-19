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
import { Ionicons } from "@expo/vector-icons";
import { radius, spacing, shadow } from "@theme/tokens";
import { useNativeWindTheme } from "@theme/nativewind";
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
    icon: "call",
    actionLabel: "Call",
    url: "tel:+250788123456",
  },
  {
    id: "email",
    label: "Email",
    value: "support@ibimina.rw",
    icon: "mail",
    actionLabel: "Email",
    url: "mailto:support@ibimina.rw",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    value: "+250 722 555 222",
    icon: "logo-whatsapp",
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
  const theme = useNativeWindTheme();
  const containerStyle = primary
    ? [styles.languageChip, styles.languageChipActive, { backgroundColor: theme.palette.primary }]
    : [styles.languageChip, { borderColor: theme.palette.border }];
  const labelStyle = primary
    ? [styles.languageLabel, styles.languageLabelActive]
    : [styles.languageLabel];

  return (
    <View
      style={containerStyle}
      className={primary ? `${theme.classes.surfaceTinted}` : theme.classes.surfaceMuted}
      accessibilityLabel={`${label} language ${primary ? "selected" : "available"}`}
    >
      <Text style={labelStyle} className={primary ? "text-white" : theme.classes.textPrimary}>
        {label}
      </Text>
    </View>
  );
}

export function ProfileScreen() {
  const theme = useNativeWindTheme();

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
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.palette.background }]}
      className={theme.classes.background}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        contentContainerClassName="gap-5"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title} className={theme.classes.textPrimary}>
              Your Profile
            </Text>
            <Text style={styles.subtitle} className={theme.classes.textSecondary}>
              Manage your contact details and preferences.
            </Text>
          </View>
          <StatusChip label="Verified Member" tone="success" />
        </View>

        <View
          style={[styles.card, { borderColor: theme.palette.border }]}
          className={`${theme.classes.surface} ${theme.classes.border} ${theme.classes.cardShadow}`}
        >
          <Text style={styles.cardTitle} className={theme.classes.textPrimary}>
            Contact information
          </Text>
          {CONTACT_DETAILS.map((detail) => (
            <View key={detail.id} style={styles.contactRow}>
              <IconBadge icon={detail.icon} label={detail.label} />
              <View style={styles.contactBody}>
                <Text style={styles.contactLabel} className={theme.classes.textMuted}>
                  {detail.label}
                </Text>
                <Text style={styles.contactValue} className={theme.classes.textPrimary}>
                  {detail.value}
                </Text>
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={[styles.primaryAction, { backgroundColor: theme.palette.primary }]}
                  onPress={() => handleOpenUrl(detail.url)}
                  accessibilityLabel={`${detail.actionLabel} ${detail.label}`}
                >
                  <Text style={styles.primaryActionLabel}>{detail.actionLabel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryAction, { backgroundColor: theme.palette.card }]}
                  onPress={() => handleCopy(detail.label, detail.value)}
                  accessibilityLabel={`Copy ${detail.label}`}
                >
                  <Text style={styles.secondaryActionLabel} className={theme.classes.accent}>
                    Copy
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View
          style={[styles.card, { borderColor: theme.palette.border }]}
          className={`${theme.classes.surface} ${theme.classes.border} ${theme.classes.cardShadow}`}
        >
          <Text style={styles.cardTitle} className={theme.classes.textPrimary}>
            Preferred languages
          </Text>
          <View style={styles.languageRow}>
            {LANGUAGES.map((language) => (
              <LanguageChip key={language.id} label={language.label} primary={language.primary} />
            ))}
          </View>
          <Text style={styles.languageHint} className={theme.classes.textMuted}>
            Switching languages syncs across all your Ibimina devices.
          </Text>
        </View>

        <View
          style={[styles.card, { borderColor: theme.palette.border }]}
          className={`${theme.classes.surface} ${theme.classes.border} ${theme.classes.cardShadow}`}
        >
          <Text style={styles.cardTitle} className={theme.classes.textPrimary}>
            Support
          </Text>
          {SUPPORT_ACTIONS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.listRow}
              onPress={() => handleOpenUrl(item.url)}
              accessibilityLabel={item.title}
            >
              <View style={styles.listRowBody}>
                <Text style={styles.listRowTitle} className={theme.classes.textPrimary}>
                  {item.title}
                </Text>
                <Text style={styles.listRowDescription} className={theme.classes.textSecondary}>
                  {item.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.palette.textDefault} />
            </TouchableOpacity>
          ))}
        </View>

        <View
          style={[styles.card, { borderColor: theme.palette.border }]}
          className={`${theme.classes.surface} ${theme.classes.border} ${theme.classes.cardShadow}`}
        >
          <Text style={styles.cardTitle} className={theme.classes.textPrimary}>
            Legal
          </Text>
          {LEGAL_LINKS.map((link) => (
            <TouchableOpacity
              key={link.id}
              style={styles.listRow}
              onPress={() => handleOpenUrl(link.url)}
              accessibilityLabel={link.title}
            >
              <View style={styles.listRowBody}>
                <Text style={styles.listRowTitle} className={theme.classes.textPrimary}>
                  {link.title}
                </Text>
                <Text style={styles.listRowDescription} className={theme.classes.textSecondary}>
                  Updated December 2024
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.palette.textDefault} />
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
  },
  subtitle: {
    fontSize: 14,
    marginTop: spacing.xs,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    gap: spacing.md,
    ...shadow.card,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
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
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  contactActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginLeft: spacing.sm,
  },
  primaryAction: {
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
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  secondaryActionLabel: {
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
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  languageChipActive: {
    borderColor: "transparent",
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  languageLabelActive: {},
  languageHint: {
    fontSize: 13,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  listRowBody: {
    flex: 1,
    gap: spacing.xs / 2,
    paddingRight: spacing.sm,
  },
  listRowTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  listRowDescription: {
    fontSize: 13,
  },
  listRowChevron: {
    fontSize: 24,
  },
});
