import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { type IkiminaGroup } from "@ibimina/data-access";

export type IkiminaCardProps = {
  group: IkiminaGroup;
  onPress?: (group: IkiminaGroup) => void;
  onJoin?: (group: IkiminaGroup) => void;
};

function formatAmount(amount: number | null, currency: string) {
  if (!amount) return "Flexible";
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
}

const IkiminaCardComponent = ({ group, onPress, onJoin }: IkiminaCardProps) => {
  const handlePress = useCallback(async () => {
    await Haptics.selectionAsync();
    onPress?.(group);
  }, [group, onPress]);

  const handleJoin = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onJoin?.(group);
  }, [group, onJoin]);

  return (
    <LinearGradient colors={["rgba(14,22,62,0.8)", "rgba(21,34,87,0.6)"]} style={styles.container}>
      <Pressable style={styles.pressable} onPress={handlePress}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{group.name}</Text>
            <Text style={styles.subtitle}>{group.code}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{group.memberCount} members</Text>
          </View>
        </View>
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Contribution</Text>
            <Text style={styles.metricValue}>
              {formatAmount(group.contributionAmount, group.contributionCurrency)}
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Frequency</Text>
            <Text style={styles.metricValue}>{group.contributionFrequency}</Text>
          </View>
        </View>
        <Pressable
          onPress={handleJoin}
          style={({ pressed }) => [styles.joinButton, pressed && styles.joinButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel={`Join ${group.name}`}
        >
          <Text style={styles.joinButtonText}>Request to join</Text>
        </Pressable>
      </Pressable>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 1,
    marginBottom: 16,
  },
  pressable: {
    backgroundColor: "rgba(11,16,43,0.6)",
    borderRadius: 23,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#0a133a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F5F7FF",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "rgba(240,242,255,0.7)",
    letterSpacing: 0.6,
  },
  badge: {
    backgroundColor: "rgba(99,123,255,0.35)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  badgeText: {
    color: "#E6EAFF",
    fontSize: 12,
    fontWeight: "600",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: "rgba(235,239,255,0.65)",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  metricValue: {
    marginTop: 6,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  joinButton: {
    marginTop: 20,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(125,159,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(148,176,255,0.45)",
  },
  joinButtonPressed: {
    backgroundColor: "rgba(148,176,255,0.32)",
  },
  joinButtonText: {
    color: "#F8FAFF",
    fontWeight: "600",
  },
});

export const IkiminaCard = memo(IkiminaCardComponent);
