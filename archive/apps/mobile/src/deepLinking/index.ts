import { Linking, NativeEventSubscription, Platform } from "react-native";
import { createURL } from "expo-linking";

export type DeepLinkHandler = (params: URLSearchParams) => void | Promise<void>;

const handlers = new Map<string, DeepLinkHandler>();
let subscription: NativeEventSubscription | null = null;

export function registerDeepLinkHandler(path: string, handler: DeepLinkHandler): void {
  handlers.set(path, handler);
  ensureSubscription();
}

export function unregisterDeepLinkHandler(path: string): void {
  handlers.delete(path);
  if (handlers.size === 0) {
    subscription?.remove();
    subscription = null;
  }
}

export function buildDeepLink(
  path: string,
  params?: Record<string, string | number | boolean>
): string {
  const cleanedPath = path.startsWith("/") ? path.slice(1) : path;
  return createURL(cleanedPath, { queryParams: params });
}

function ensureSubscription(): void {
  if (subscription || Platform.OS === "web") {
    return;
  }
  subscription = Linking.addEventListener("url", async (event) => {
    try {
      const url = new URL(event.url);
      const path = url.pathname.replace(/^\//, "");
      const handler = handlers.get(path);
      if (!handler) {
        return;
      }
      await handler(url.searchParams);
    } catch (error) {
      console.warn("Failed to dispatch deep link", error);
    }
  });
}

export function configureDefaultHandlers() {
  registerDeepLinkHandler("pay", async (params) => {
    const member = params.get("member");
    const amount = params.get("amount");
    console.info("Deep link to Pay flow", { member, amount });
  });

  registerDeepLinkHandler("reference", async (params) => {
    const referenceId = params.get("id");
    console.info("Deep link to reference", { referenceId });
  });
}
