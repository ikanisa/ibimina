import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import HomeScreen from "../(tabs)/home";

jest.mock("@ibimina/data-access", () => ({
  fetchGroups: jest.fn(async () => []),
  fetchStatements: jest.fn(async () => []),
  streamAssistMessage: jest.fn(),
  createSupabaseClient: jest.fn(() => ({})),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

jest.mock("../../src/features/groups/hooks/useGroups", () => ({
  useGroups: () => ({
    data: {
      pages: [
        [
          {
            id: "1",
            name: "Community Savings",
            status: "active",
            contributionAmount: 540000,
            contributionCurrency: "RWF",
            memberCount: 12,
            nextCollectionDate: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Mothers Fund",
            status: "invited",
            contributionAmount: 875000,
            contributionCurrency: "RWF",
            memberCount: 18,
            nextCollectionDate: null,
          },
        ],
      ],
    },
    isLoading: false,
  }),
  useSubmitJoinRequest: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock("../../src/features/allocations/hooks/useAllocations", () => ({
  useAllocations: () => ({
    data: [
      {
        id: "alloc-1",
        createdAt: new Date("2024-10-01").toISOString(),
        groupName: "Community Savings",
        amount: 240000,
        currency: "RWF",
      },
    ],
    isLoading: false,
  }),
  useReferenceTokens: () => ({
    data: [
      {
        token: "REF-1",
      },
    ],
  }),
}));

jest.mock(
  "expo-haptics",
  () => ({
    impactAsync: jest.fn(),
    ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
  }),
  { virtual: true }
);

jest.mock("../../src/providers/supabase-client", () => {
  const React = require("react");

  return {
    useSupabase: () => ({ from: jest.fn() }),
    SupabaseProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, { testID: "linear-gradient" }, children),
  };
});

jest.mock("../../src/components/shared/HeaderGradient", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    HeaderGradient: ({ title, subtitle }: { title: string; subtitle: string }) =>
      React.createElement(
        React.Fragment,
        null,
        React.createElement(Text, { accessibilityRole: "header" }, title),
        React.createElement(Text, null, subtitle)
      ),
  };
});

jest.mock("../../src/components/shared/FloatingAskToJoinFab", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    FloatingAskToJoinFab: ({ label }: { label: string }) => React.createElement(Text, null, label),
  };
});

jest.mock("react-intl", () => ({
  useIntl: () => ({
    formatMessage: ({ defaultMessage }: { defaultMessage: string }) => defaultMessage,
    formatNumber: (value: number) => value.toString(),
  }),
}));

describe("HomeScreen", () => {
  const useQuery = require("@tanstack/react-query").useQuery as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    useQuery.mockImplementation(({ queryKey }: { queryKey: [string] }) => {
      if (queryKey[0] === "groups") {
        return {
          data: [
            {
              id: "1",
              name: "Community Savings",
              description: "Weekly",
              memberCount: 12,
              totalSavings: 540000,
              currency: "RWF",
              joined: true,
            },
            {
              id: "2",
              name: "Mothers Fund",
              description: "Monthly",
              memberCount: 18,
              totalSavings: 875000,
              currency: "RWF",
              joined: false,
            },
          ],
          isLoading: false,
        };
      }

      return {
        data: [
          {
            id: "10",
            month: "October",
            groupName: "Community Savings",
            closingBalance: 240000,
            currency: "RWF",
          },
        ],
        isLoading: false,
      };
    });
  });

  it("shows groups, statements, and quick actions", async () => {
    const { getByText, getAllByText, queryByText } = render(<HomeScreen />);

    expect(getByText("Hello")).toBeTruthy();
    expect(getByText("Track your savings in real time")).toBeTruthy();
    expect(getByText("Your groups")).toBeTruthy();
    await waitFor(() => expect(getAllByText("Community Savings").length).toBeGreaterThan(0));
    await waitFor(() => expect(getByText("Mothers Fund")).toBeTruthy());
    expect(queryByText("Loading...")).toBeNull();
    expect(getByText("Recent statements")).toBeTruthy();
    await waitFor(() => expect(getByText(/October/)).toBeTruthy());
    expect(getByText("Ask to Join")).toBeTruthy();
  });
});
