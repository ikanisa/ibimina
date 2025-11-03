import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor Configuration for Ibimina Client App
 *
 * This configures the Android app wrapper for the Ibimina PWA.
 * The app can work in two modes:
 *
 * 1. Development: Connects to localhost:3001 for hot-reloading
 * 2. Production: Loads from the production server URL
 *
 * To build for production, set CAPACITOR_SERVER_URL environment variable:
 * CAPACITOR_SERVER_URL=https://client.ibimina.rw pnpm cap sync
 */

const config: CapacitorConfig = {
  appId: "rw.ibimina.client",
  appName: "Ibimina",
  webDir: ".next-static",
  server: {
    androidScheme: "https",
    url: "https://4095a3b5-fbd8-407c-bbf4-c6a12f21341e-00-2ss8fo7up7zir.kirk.replit.dev",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#0066FF",
    webContentsDebuggingEnabled: true,
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#0066FF",
    scheme: "Ibimina",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0066FF",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#ffffff",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
    Camera: {
      quality: 90,
      allowEditing: true,
      resultType: "uri",
      saveToGallery: false,
    },
    StatusBar: {
      style: "light",
      backgroundColor: "#0066FF",
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
