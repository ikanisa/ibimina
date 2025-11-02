module.exports = ({ config }) => {
  const versionCode = parseInt(process.env.ANDROID_VERSION_CODE || "1", 10);
  const projectId =
    process.env.EAS_PROJECT_ID ||
    process.env.EAS_PROJECT_ID_SACCO ||
    "00000000-0000-0000-0000-000000000000";
  const apiBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL_SACCO || "";

  return {
    ...config,
    name: "sacco-plus-client",
    slug: "sacco-plus-client",
    version: process.env.APP_VERSION || "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: process.env.IOS_BUNDLE_IDENTIFIER || "com.ibimina.saccoplus",
      buildNumber: process.env.IOS_BUILD_NUMBER || "1",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      package: process.env.ANDROID_APPLICATION_ID || "rw.ibimina.saccoplus",
      versionCode,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      eas: {
        projectId,
      },
      apiBaseUrl,
    },
    owner: "ibimina",
  };
};
