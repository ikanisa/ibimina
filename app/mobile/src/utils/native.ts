import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Alert, Linking, Platform } from "react-native";

export async function triggerHaptic(style: ImpactStyle = ImpactStyle.Medium) {
  if (!Capacitor.isPluginAvailable("Haptics")) {
    return;
  }

  try {
    await Haptics.impact({ style });
  } catch (error) {
    console.warn("Unable to trigger haptic feedback", error);
  }
}

export async function copyToClipboard(text: string) {
  try {
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("Clipboard")) {
      const plugin = (await import("@capacitor/clipboard").catch(() => null)) as {
        Clipboard: { write(options: { string: string }): Promise<void> };
      } | null;

      if (plugin?.Clipboard) {
        await plugin.Clipboard.write({ string: text });
        return true;
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    console.warn("Clipboard copy failed", error);
  }

  return false;
}

export async function dialUssd(ussdCode: string) {
  if (Platform.OS !== "android") {
    Alert.alert(
      "Dial from phone",
      "USSD payments are only supported on Android. Dial manually using: " + ussdCode
    );
    return false;
  }

  const telUrl = `tel:${ussdCode.replace(/#/g, "%23")}`;

  try {
    const supported = await Linking.canOpenURL(telUrl);
    if (!supported) {
      throw new Error("Dialer unsupported");
    }
    await Linking.openURL(telUrl);
    return true;
  } catch (error) {
    console.error("Failed to open dialer", error);
    Alert.alert("Dialer unavailable", "We couldn't open the dialer. Dial manually: " + ussdCode);
    return false;
  }
}
