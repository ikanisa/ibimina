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
  appId: "rw.gov.ikanisa.ibimina.client",
  appName: "Ibimina Client",
  webDir: "out",
  server: {
    androidScheme: "https",
    cleartext: true,
    // For production builds, set CAPACITOR_SERVER_URL
    // For development, defaults to localhost
    ...(process.env.CAPACITOR_SERVER_URL && {
      url: process.env.CAPACITOR_SERVER_URL,
    }),
  },
  android: {
    // Allow mixed content for development
    allowMixedContent: false,
    // Background color for splash screen
    backgroundColor: "#0b1020",
    // Enable web view debugging in debug builds
    webContentsDebuggingEnabled: true,
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
  },
};

export default config;
