import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type ReferenceCardProps = {
  reference?: string | null;
  onShowUSSD: () => void;
};

const ReferenceCardComponent = ({ reference, onShowUSSD }: ReferenceCardProps) => {
  return (
    <LinearGradient
      colors={["rgba(18,28,68,0.85)", "rgba(18,32,74,0.58)"]}
      style={styles.container}
    >
      <Text style={styles.label}>Your reference token</Text>
      <Text selectable style={styles.reference}>
        {reference ?? "-- --"}
      </Text>
      <Text style={styles.helper}>Keep it private. Share only when paying.</Text>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={async () => {
          await Haptics.selectionAsync();
          onShowUSSD();
        }}
      >
        <Text style={styles.buttonText}>How to pay with MoMo</Text>
      </Pressable>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 24,
  },
  label: {
    color: "rgba(210,220,255,0.76)",
    fontSize: 13,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  reference: {
    marginTop: 10,
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 4,
  },
  helper: {
    marginTop: 8,
    color: "rgba(230,235,255,0.7)",
  },
  button: {
    marginTop: 18,
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(115,144,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(160,188,255,0.4)",
  },
  buttonPressed: {
    backgroundColor: "rgba(160,188,255,0.32)",
  },
  buttonText: {
    color: "#F6F9FF",
    fontWeight: "600",
  },
});

export const ReferenceCard = memo(ReferenceCardComponent);
