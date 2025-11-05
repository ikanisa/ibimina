/**
 * Deep Linking Configuration
 * Handles navigation from push notifications and external links
 */

import { LinkingOptions } from "@react-navigation/native";
import * as Linking from "expo-linking";

const prefix = Linking.createURL("/");

export const linking: LinkingOptions<any> = {
  prefixes: [prefix, "ibimina://", "https://ibimina.rw", "https://app.ibimina.rw"],
  config: {
    screens: {
      Auth: {
        screens: {
          Onboarding: "onboarding",
          WhatsAppAuth: "auth",
        },
      },
      Main: {
        screens: {
          Home: "home",
          Accounts: {
            screens: {
              AccountsList: "accounts",
              AccountDetail: "accounts/:accountId",
            },
          },
          Loans: {
            screens: {
              LoansList: "loans",
              LoanDetail: "loans/:loanId",
              LoanApplication: "loans/apply",
            },
          },
          Groups: {
            screens: {
              GroupsList: "groups",
              GroupDetail: "groups/:groupId",
              GroupContribution: "groups/:groupId/contribute",
            },
          },
          Profile: {
            screens: {
              ProfileHome: "profile",
              Settings: "profile/settings",
            },
          },
        },
      },
      // Deep link targets for notifications
      TransactionDetail: "transactions/:transactionId",
      NotificationDetail: "notifications/:notificationId",
    },
  },
  async getInitialURL() {
    // Check if app was opened from a deep link
    const url = await Linking.getInitialURL();
    if (url != null) {
      return url;
    }

    // Check if there's a notification that launched the app
    // This will be handled by the notification service
    return null;
  },
  subscribe(listener) {
    // Listen to incoming links from deep linking
    const onReceiveURL = ({ url }: { url: string }) => {
      listener(url);
    };

    const subscription = Linking.addEventListener("url", onReceiveURL);

    return () => {
      subscription.remove();
    };
  },
};

/**
 * Helper to navigate from notification data
 */
export function getScreenFromNotification(data: any): { screen: string; params?: any } {
  const { type, id, accountId, loanId, groupId, transactionId } = data;

  switch (type) {
    case "transaction":
      return { screen: "TransactionDetail", params: { transactionId: id || transactionId } };

    case "loan_approved":
    case "loan_rejected":
    case "loan_disbursed":
      return { screen: "LoanDetail", params: { loanId: id || loanId } };

    case "group_contribution":
    case "group_payout":
      return { screen: "GroupDetail", params: { groupId: id || groupId } };

    case "account_update":
      return { screen: "AccountDetail", params: { accountId: id || accountId } };

    default:
      return { screen: "Home" };
  }
}
