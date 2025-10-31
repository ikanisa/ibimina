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
  webDir: ".next",
  server: {
    androidScheme: "https",
    cleartext: false, // Enforce HTTPS in production
    // For production builds, set CAPACITOR_SERVER_URL
    // For development, defaults to localhost
    ...(process.env.CAPACITOR_SERVER_URL && {
      url: process.env.CAPACITOR_SERVER_URL,
    }),
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
