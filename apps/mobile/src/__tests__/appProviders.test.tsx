import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { AppProviders } from "../app";
import { useAppStore } from "../providers/store";

jest.mock("react-native-gesture-handler", () => {
  const React = require("react");
  const { View } = require("react-native");
  const actual = jest.requireActual("react-native-gesture-handler");

  return {
    ...actual,
    GestureHandlerRootView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, { style: { flex: 1 }, testID: "gesture-root" }, children),
  };
});

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

const { Text } = require("react-native");

jest.mock("../lib/sentry", () => ({
  initSentry: jest.fn(),
}));

jest.mock("../lib/posthog", () => ({
  initPostHog: jest.fn(),
}));

jest.mock("../storage/authToken", () => ({
  hydrateAuthToken: jest.fn(),
  getStoredAuthToken: jest.fn(),
}));

jest.mock("../features/feature-flags/hooks/useFeatureFlags", () => ({
  useFeatureFlags: jest.fn(() => ({
    data: { ai_agent: { key: "ai_agent", enabled: true } },
    isLoading: false,
  })),
}));

jest.mock("@ibimina/data-access", () => ({
  createSupabaseClient: jest.fn(() => ({})),
}));

describe("AppProviders", () => {
  const { initSentry } = require("../lib/sentry");
  const { initPostHog } = require("../lib/posthog");
  const { hydrateAuthToken, getStoredAuthToken } = require("../storage/authToken");

  beforeEach(() => {
    jest.clearAllMocks();
    useAppStore.getState().reset();
    initSentry.mockImplementation(() => {});
    initPostHog.mockImplementation(() => {});
    hydrateAuthToken.mockResolvedValue("async-token");
    getStoredAuthToken.mockReturnValue(null);
  });

  it("renders children and resolves async initialization flows", async () => {
    const { getByText } = render(
      <AppProviders>
        <Text testID="child">ready</Text>
      </AppProviders>
    );

    expect(getByText("ready")).toBeTruthy();

    await waitFor(() => {
      expect(initPostHog).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      const state = useAppStore.getState();
      expect(state.featureFlags).toEqual({ ai_agent: true });
      expect(state.authToken).toBe("async-token");
      expect(state.hasHydratedAuth).toBe(true);
    });
  });

  it("hydrates stored auth token synchronously when present", async () => {
    getStoredAuthToken.mockReturnValue("persisted-token");
    hydrateAuthToken.mockResolvedValue(null);

    render(
      <AppProviders>
        <Text>ready</Text>
      </AppProviders>
    );

    await waitFor(() => {
      const state = useAppStore.getState();
      expect(state.authToken).toBe("persisted-token");
      expect(state.hasHydratedAuth).toBe(true);
    });

    expect(hydrateAuthToken).not.toHaveBeenCalled();
  });
});
