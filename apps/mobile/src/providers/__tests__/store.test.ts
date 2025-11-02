import { act } from "@testing-library/react-native";
import { useAppStore } from "../store";

describe("useAppStore", () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  it("tracks authentication state", () => {
    act(() => {
      useAppStore.getState().setAuthToken("token-123");
    });

    const afterAuth = useAppStore.getState();
    expect(afterAuth.authToken).toBe("token-123");
    expect(afterAuth.isAuthenticated).toBe(true);

    act(() => {
      useAppStore.getState().setAuthenticated(false);
    });

    const afterLogout = useAppStore.getState();
    expect(afterLogout.authToken).toBeNull();
    expect(afterLogout.isAuthenticated).toBe(false);
  });

  it("stores feature flag snapshots", () => {
    const flags = { onboarding: true };
    act(() => {
      useAppStore.getState().setFeatureFlags(flags);
    });

    expect(useAppStore.getState().featureFlags).toEqual(flags);
  });
});
