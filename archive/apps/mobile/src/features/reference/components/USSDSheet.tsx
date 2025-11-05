import { memo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

export type USSDSheetProps = {
  visible: boolean;
  onClose: () => void;
  referenceToken?: string | null;
};

const USSD_SHORTCODE = "*182*8*1#";

const USSDSheetComponent = ({ visible, onClose, referenceToken }: USSDSheetProps) => {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.heading}>Pay with MoMo</Text>
          <Text style={styles.subtitle}>
            Dial {USSD_SHORTCODE} and enter your reference to route the payment.
          </Text>
          <View style={styles.tokenCard}>
            <Text style={styles.tokenLabel}>Reference token</Text>
            <Text selectable style={styles.tokenValue}>
              {referenceToken ?? "--"}
            </Text>
          </View>
          <View style={styles.steps}>
            <Text style={styles.step}>1. Dial {USSD_SHORTCODE}</Text>
            <Text style={styles.step}>2. Choose "Cooperative" then your SACCO</Text>
            <Text style={styles.step}>3. Enter the reference token above</Text>
            <Text style={styles.step}>4. Confirm the amount suggested in the app</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
            onPress={async () => {
              await Haptics.selectionAsync();
              onClose();
            }}
          >
            <Text style={styles.closeButtonText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(8,11,24,0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "rgba(12,18,40,0.95)",
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  heading: {
    color: "#F5F8FF",
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 8,
    color: "rgba(235,240,255,0.72)",
    lineHeight: 20,
  },
  tokenCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "rgba(22,35,68,0.9)",
    borderWidth: 1,
    borderColor: "rgba(120,148,255,0.3)",
  },
  tokenLabel: {
    fontSize: 12,
    color: "rgba(226,234,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 1.3,
  },
  tokenValue: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 2.4,
    color: "#FFFFFF",
  },
  steps: {
    marginTop: 22,
    gap: 8,
  },
  step: {
    color: "rgba(217,226,255,0.86)",
    fontSize: 14,
  },
  closeButton: {
    marginTop: 28,
    alignSelf: "center",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(112,142,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(154,183,255,0.45)",
  },
  closeButtonPressed: {
    backgroundColor: "rgba(154,183,255,0.32)",
  },
  closeButtonText: {
    color: "#F8FAFF",
    fontWeight: "600",
  },
});

export const USSDSheet = memo(USSDSheetComponent);
