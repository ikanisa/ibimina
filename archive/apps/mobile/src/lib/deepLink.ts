/**
 * Deep linking configuration and handlers
 */

import * as Linking from "expo-linking";

export const deepLinkConfig = {
  prefixes: ["ibimina://", "https://app.ibimina.rw"],
  config: {
    screens: {
      index: "",
      home: "home",
      pay: "pay",
      statements: "statements",
      offers: "offers",
      profile: "profile",
      group: "group/:id",
      transaction: "transaction/:id",
      payment: "payment/:groupId",
      loan: "loan/:groupId",
    },
  },
};

/**
 * Parse deep link URL
 */
export function parseDeepLink(url: string) {
  return Linking.parse(url);
}

/**
 * Create deep link URL
 */
export function createDeepLink(path: string, params?: Record<string, string>) {
  return Linking.createURL(path, { queryParams: params });
}

/**
 * Handle deep link navigation
 */
export function handleDeepLink(url: string, navigate: (path: string, params?: any) => void) {
  const parsed = parseDeepLink(url);

  if (!parsed.path) return;

  // Extract route and params
  const { path, queryParams } = parsed;

  // Navigate based on path
  navigate(path, queryParams);
}

/**
 * Register deep link listener
 */
export function registerDeepLinkListener(callback: (url: string) => void): () => void {
  const subscription = Linking.addEventListener("url", (event) => {
    callback(event.url);
  });

  return () => {
    subscription.remove();
  };
}

/**
 * Get initial deep link URL (if app was opened via link)
 */
export async function getInitialDeepLink(): Promise<string | null> {
  return await Linking.getInitialURL();
}
