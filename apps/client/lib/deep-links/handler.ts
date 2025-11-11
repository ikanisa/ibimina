/**
 * Deep Link Handler
 *
 * Handles incoming deep links from:
 * - Android App Links (https://client.ibimina.rw/...)
 * - iOS Universal Links (https://client.ibimina.rw/...)
 * - Custom Scheme (ibimina://...)
 *
 * Supported patterns:
 * - /join/:groupId - Join a group
 * - /invite/:token - Accept an invite
 * - /group/:id - View group details
 * - /pay - Navigate to pay screen
 * - /statements - Navigate to statements
 * - /profile - Navigate to profile
 */

import { App, URLOpenListenerEvent } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

export type DeepLinkRoute =
  | { type: "join"; groupId: string }
  | { type: "invite"; token: string }
  | { type: "group"; id: string }
  | { type: "pay" }
  | { type: "statements" }
  | { type: "profile" }
  | { type: "home" }
  | { type: "unknown"; url: string };

export type DeepLinkHandler = (route: DeepLinkRoute) => void | Promise<void>;

const isNative =
  typeof window !== "undefined" && typeof Capacitor !== "undefined" && Capacitor.isNativePlatform();

/**
 * Parse a URL into a DeepLinkRoute
 */
export function parseDeepLink(url: string): DeepLinkRoute {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;

    // Remove leading slash
    const path = pathname.startsWith("/") ? pathname.slice(1) : pathname;
    const segments = path.split("/").filter(Boolean);

    // Match route patterns
    if (segments[0] === "join" && segments[1]) {
      return { type: "join", groupId: segments[1] };
    }

    if (segments[0] === "invite" && segments[1]) {
      return { type: "invite", token: segments[1] };
    }

    if (segments[0] === "group" && segments[1]) {
      return { type: "group", id: segments[1] };
    }

    if (segments[0] === "groups" && segments[1]) {
      return { type: "group", id: segments[1] };
    }

    if (segments[0] === "pay") {
      return { type: "pay" };
    }

    if (segments[0] === "statements") {
      return { type: "statements" };
    }

    if (segments[0] === "profile") {
      return { type: "profile" };
    }

    if (segments.length === 0) {
      return { type: "home" };
    }

    // Check query parameters for custom scheme (ibimina://join?group_id=123)
    const groupId = parsed.searchParams.get("group_id");
    const token = parsed.searchParams.get("token");

    if (parsed.protocol === "ibimina:" && groupId) {
      return { type: "join", groupId };
    }

    if (parsed.protocol === "ibimina:" && token) {
      return { type: "invite", token };
    }

    return { type: "unknown", url };
  } catch (error) {
    console.error("Failed to parse deep link:", error);
    return { type: "unknown", url };
  }
}

/**
 * Register a handler for incoming deep links
 * Returns a cleanup function to remove the listener
 */
export function registerDeepLinkHandler(handler: DeepLinkHandler): () => void {
  if (!isNative) {
    console.warn("Deep link handler registered but not on native platform");
    return () => {};
  }

  const listener = async (event: URLOpenListenerEvent) => {
    const url = event.url;
    // eslint-disable-next-line ibimina/structured-logging
    console.log("Deep link received:", url);

    const route = parseDeepLink(url);
    // eslint-disable-next-line ibimina/structured-logging
    console.log("Parsed route:", route);

    try {
      await handler(route);
    } catch (error) {
      console.error("Deep link handler error:", error);
    }
  };

  // Add listener (returns Promise<PluginListenerHandle>)
  const appUrlListenerHandle = App.addListener("appUrlOpen", listener);

  // Return cleanup function
  return () => {
    appUrlListenerHandle.then((handle) => handle.remove());
  };
}

/**
 * Check if the app was opened via a deep link
 * Call this on app startup to handle initial deep link
 */
export async function checkInitialDeepLink(handler: DeepLinkHandler): Promise<void> {
  if (!isNative) {
    return;
  }

  try {
    const result = await App.getLaunchUrl();
    if (result?.url) {
      // eslint-disable-next-line ibimina/structured-logging
      console.log("App opened with deep link:", result.url);
      const route = parseDeepLink(result.url);
      await handler(route);
    }
  } catch (error) {
    console.error("Failed to check initial deep link:", error);
  }
}

/**
 * Generate a deep link URL for sharing
 */
export function generateDeepLink(route: DeepLinkRoute): string {
  const baseUrl = "https://client.ibimina.rw";

  switch (route.type) {
    case "join":
      return `${baseUrl}/join/${route.groupId}`;
    case "invite":
      return `${baseUrl}/invite/${route.token}`;
    case "group":
      return `${baseUrl}/groups/${route.id}`;
    case "pay":
      return `${baseUrl}/pay`;
    case "statements":
      return `${baseUrl}/statements`;
    case "profile":
      return `${baseUrl}/profile`;
    case "home":
      return baseUrl;
    default:
      return baseUrl;
  }
}

/**
 * Generate a custom scheme deep link (fallback)
 */
export function generateCustomSchemeLink(route: DeepLinkRoute): string {
  switch (route.type) {
    case "join":
      return `ibimina://join?group_id=${route.groupId}`;
    case "invite":
      return `ibimina://invite?token=${route.token}`;
    case "group":
      return `ibimina://group?id=${route.id}`;
    case "pay":
      return `ibimina://pay`;
    case "statements":
      return `ibimina://statements`;
    case "profile":
      return `ibimina://profile`;
    case "home":
      return `ibimina://home`;
    default:
      return `ibimina://home`;
  }
}
