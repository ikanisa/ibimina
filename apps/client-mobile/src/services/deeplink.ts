import * as Linking from "expo-linking";
import { NavigationContainerRef } from "@react-navigation/native";

export type DeepLinkRoute =
  | "home"
  | "accounts"
  | "transactions"
  | "loans"
  | "loan-detail"
  | "loan-apply"
  | "groups"
  | "group-detail"
  | "group-contribute"
  | "profile"
  | "notifications";

export interface DeepLinkParams {
  id?: string;
  group_id?: string;
  loan_id?: string;
  [key: string]: any;
}

class DeepLinkService {
  private navigationRef: NavigationContainerRef<any> | null = null;

  setNavigationRef(ref: NavigationContainerRef<any>) {
    this.navigationRef = ref;
  }

  /**
   * Parse a deep link URL
   * Examples:
   * - ibimina://loans/123
   * - https://app.ibimina.rw/loans/123
   * - https://ibimina.rw/app/loans/123
   */
  parseUrl(url: string): { route: DeepLinkRoute; params?: DeepLinkParams } | null {
    try {
      const parsed = Linking.parse(url);
      const path = parsed.path || "";
      const pathParts = path.split("/").filter(Boolean);

      // Handle ibimina:// scheme
      if (parsed.scheme === "ibimina") {
        return this.parseAppScheme(pathParts, parsed.queryParams);
      }

      // Handle https:// web links
      if (parsed.hostname === "app.ibimina.rw") {
        return this.parseAppScheme(pathParts, parsed.queryParams);
      }

      if (parsed.hostname === "ibimina.rw" && pathParts[0] === "app") {
        // Remove 'app' prefix
        return this.parseAppScheme(pathParts.slice(1), parsed.queryParams);
      }

      return null;
    } catch (error) {
      console.error("Failed to parse deep link:", error);
      return null;
    }
  }

  private parseAppScheme(
    pathParts: string[],
    queryParams: any
  ): { route: DeepLinkRoute; params?: DeepLinkParams } | null {
    if (pathParts.length === 0) {
      return { route: "home" };
    }

    const [section, id, action] = pathParts;

    switch (section) {
      case "home":
        return { route: "home" };

      case "accounts":
        return { route: "accounts" };

      case "transactions":
        return { route: "transactions" };

      case "loans":
        if (!id) return { route: "loans" };
        if (id === "apply") return { route: "loan-apply" };
        return { route: "loan-detail", params: { loan_id: id } };

      case "groups":
        if (!id) return { route: "groups" };
        if (action === "contribute") {
          return { route: "group-contribute", params: { group_id: id } };
        }
        return { route: "group-detail", params: { group_id: id } };

      case "profile":
        return { route: "profile" };

      case "notifications":
        return { route: "notifications" };

      default:
        return null;
    }
  }

  /**
   * Navigate to a route parsed from a deep link
   */
  navigate(route: DeepLinkRoute, params?: DeepLinkParams) {
    if (!this.navigationRef) {
      console.warn("Navigation ref not set");
      return;
    }

    // Map routes to screen names
    const screenMap: Record<DeepLinkRoute, string> = {
      home: "Home",
      accounts: "Accounts",
      transactions: "Transactions",
      loans: "Loans",
      "loan-detail": "LoanDetail",
      "loan-apply": "LoanApplication",
      groups: "Groups",
      "group-detail": "GroupDetail",
      "group-contribute": "GroupContribution",
      profile: "Profile",
      notifications: "Notifications",
    };

    const screenName = screenMap[route];
    if (!screenName) {
      console.warn(`Unknown route: ${route}`);
      return;
    }

    try {
      this.navigationRef.navigate(screenName as any, params);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }

  /**
   * Handle incoming deep link
   */
  async handleUrl(url: string) {
    const parsed = this.parseUrl(url);
    if (parsed) {
      this.navigate(parsed.route, parsed.params);
    }
  }

  /**
   * Subscribe to deep link events
   */
  subscribe(callback: (url: string) => void) {
    return Linking.addEventListener("url", ({ url }) => {
      callback(url);
    });
  }

  /**
   * Get initial URL (for app opened via deep link)
   */
  async getInitialUrl(): Promise<string | null> {
    return await Linking.getInitialURL();
  }

  /**
   * Generate a deep link URL
   */
  createUrl(route: DeepLinkRoute, params?: DeepLinkParams): string {
    const baseUrl = "ibimina://";

    switch (route) {
      case "home":
        return `${baseUrl}home`;

      case "accounts":
        return `${baseUrl}accounts`;

      case "transactions":
        return `${baseUrl}transactions`;

      case "loans":
        return `${baseUrl}loans`;

      case "loan-detail":
        return `${baseUrl}loans/${params?.loan_id}`;

      case "loan-apply":
        return `${baseUrl}loans/apply`;

      case "groups":
        return `${baseUrl}groups`;

      case "group-detail":
        return `${baseUrl}groups/${params?.group_id}`;

      case "group-contribute":
        return `${baseUrl}groups/${params?.group_id}/contribute`;

      case "profile":
        return `${baseUrl}profile`;

      case "notifications":
        return `${baseUrl}notifications`;

      default:
        return `${baseUrl}home`;
    }
  }

  /**
   * Generate a web link (for sharing)
   */
  createWebUrl(route: DeepLinkRoute, params?: DeepLinkParams): string {
    const appUrl = this.createUrl(route, params);
    return appUrl.replace("ibimina://", "https://app.ibimina.rw/");
  }
}

export const deepLinkService = new DeepLinkService();
