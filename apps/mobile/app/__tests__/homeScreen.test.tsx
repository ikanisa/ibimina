import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import HomeScreen from "../(tabs)/home";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

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
    await waitFor(() => expect(getByText("October")).toBeTruthy());
    expect(getByText("Ask to Join")).toBeTruthy();
  });
});
