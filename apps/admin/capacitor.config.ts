import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor Configuration for Ibimina Staff Console (Admin App)
 *
 * This configures the Android app wrapper for the staff-only admin PWA.
 * The app operates in two modes:
 *
 * 1. Development: Connects to localhost:3000 for hot-reloading
 * 2. Production: Loads from the production server URL
 *
 * To build for production, set CAPACITOR_SERVER_URL environment variable:
 * CAPACITOR_SERVER_URL=https://staff.ibimina.rw pnpm cap sync
 */

const config: CapacitorConfig = {
  appId: "rw.ibimina.staff",
  appName: "Ibimina Staff",
  webDir: ".next-static",
  server: {
    androidScheme: "https",
    cleartext: true, // Allow cleartext for dev server
    // Server URL for the app to connect to
    url:
      process.env.CAPACITOR_SERVER_URL ||
      "https://4095a3b5-fbd8-407c-bbf4-c6a12f21341e-00-2ss8fo7up7zir.kirk.replit.dev",
  },
  android: {
    // Disallow mixed content for security
    allowMixedContent: false,
    // Background color for splash screen
    backgroundColor: "#0b1020",
    // Enable web view debugging in debug builds only
    webContentsDebuggingEnabled: process.env.NODE_ENV === "development",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0b1020",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#ffffff",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Camera: {
      quality: 90,
      allowEditing: true,
      resultType: "uri",
      saveToGallery: false,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#0b1020",
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
