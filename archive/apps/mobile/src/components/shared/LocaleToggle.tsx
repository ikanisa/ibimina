/**
 * Locale switcher component for language selection
 */

import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAppStore } from "../../providers/store";
import { colors, elevation } from "../../theme";

type Locale = "en" | "rw" | "fr";

const locales: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "rw", label: "Kinyarwanda", flag: "🇷🇼" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

export function LocaleToggle() {
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);

  const currentLocale = locales.find((l) => l.code === locale) || locales[1];

  return (
    <View style={styles.container}>
      {locales.map((loc) => (
        <TouchableOpacity
          key={loc.code}
          style={[styles.button, loc.code === locale && styles.buttonActive]}
          onPress={() => setLocale(loc.code)}
        >
          <Text style={styles.flag}>{loc.flag}</Text>
          <Text style={[styles.label, loc.code === locale && styles.labelActive]}>{loc.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    padding: 4,
    backgroundColor: colors.ink[800],
    borderRadius: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonActive: {
    backgroundColor: colors.rw.blue,
    ...elevation[1],
  },
  flag: {
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    color: colors.neutral[300],
    fontWeight: "500",
  },
  labelActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
