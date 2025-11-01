import { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Expo app configuration with Sentry, deep linking, and analytics
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Ibimina",
  slug: "ibimina-mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "ibimina",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#0A0E27",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.ibimina.mobile",
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      NSCameraUsageDescription: "This app uses the camera to scan QR codes for payments.",
      NSPhotoLibraryUsageDescription:
        "This app accesses your photo library to select profile pictures.",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0A0E27",
    },
    package: "com.ibimina.mobile",
    permissions: ["CAMERA", "READ_EXTERNAL_STORAGE"],
  },
  web: {
    bundler: "metro",
    output: "server",
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "react-native-mmkv",
    [
      "@sentry/react-native/expo",
      {
        organization: process.env.SENTRY_ORG || "ibimina",
        project: process.env.SENTRY_PROJECT || "mobile",
        url: process.env.SENTRY_URL || "https://sentry.io/",
      },
    ],
  ],
  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID || "00000000-0000-0000-0000-000000000000",
    },
    sentryDsn: process.env.SENTRY_DSN,
    posthogApiKey: process.env.POSTHOG_API_KEY,
    posthogHost: process.env.POSTHOG_HOST || "https://app.posthog.com",
    configcatSdkKey: process.env.CONFIGCAT_SDK_KEY,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  },
  experiments: {
    typedRoutes: true,
  },
  owner: "ibimina",
});
