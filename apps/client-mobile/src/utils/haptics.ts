import { Platform } from "react-native";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export const haptics = {
  impact: (style: "light" | "medium" | "heavy" = "medium") => {
    if (Platform.OS === "ios") {
      ReactNativeHapticFeedback.trigger("impactLight", options);
    } else {
      ReactNativeHapticFeedback.trigger("impactMedium", options);
    }
  },

  selection: () => {
    ReactNativeHapticFeedback.trigger("selection", options);
  },

  notification: (type: "success" | "warning" | "error" = "success") => {
    ReactNativeHapticFeedback.trigger(
      type === "success"
        ? "notificationSuccess"
        : type === "warning"
          ? "notificationWarning"
          : "notificationError",
      options
    );
  },

  success: () => {
    haptics.notification("success");
  },

  error: () => {
    haptics.notification("error");
  },

  warning: () => {
    haptics.notification("warning");
  },
};
