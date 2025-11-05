import { Linking, Platform } from "react-native";
import { ActivityAction, startActivityAsync } from "expo-intent-launcher";

export async function launchTapToDialIntent(phoneNumber: string): Promise<void> {
  const sanitized = phoneNumber.replace(/[^+\d]/g, "");
  if (!sanitized) {
    throw new Error("Phone number is required for dial intent");
  }

  if (Platform.OS === "android") {
    try {
      await startActivityAsync(ActivityAction.DIAL, { data: `tel:${sanitized}` });
      return;
    } catch (error) {
      console.warn("Falling back to Linking.openURL for dial intent", error);
    }
  }

  await Linking.openURL(`tel:${sanitized}`);
}
