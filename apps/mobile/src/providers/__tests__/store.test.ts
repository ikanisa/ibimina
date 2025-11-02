import { useAppStore } from "@/providers/store";

describe("useAppStore", () => {
  afterEach(() => {
    useAppStore.getState().reset();
  });

  it("updates authentication state when tokens change", () => {
    useAppStore.getState().setAuthToken("abc");
    expect(useAppStore.getState().authToken).toBe("abc");
    expect(useAppStore.getState().isAuthenticated).toBe(true);

    useAppStore.getState().setAuthenticated(true);
    expect(useAppStore.getState().authToken).toBe("abc");
    expect(useAppStore.getState().isAuthenticated).toBe(true);

    useAppStore.getState().setAuthenticated(false);
    expect(useAppStore.getState().authToken).toBeNull();
    expect(useAppStore.getState().isAuthenticated).toBe(false);
  });

  it("tracks profile fields and feature flags", () => {
    useAppStore.getState().setUserId("user-1");
    useAppStore.getState().setLocale("fr");
    useAppStore.getState().setTheme("light");
    useAppStore.getState().setFeatureFlags({ beta: true });

    const state = useAppStore.getState();
    expect(state.userId).toBe("user-1");
    expect(state.locale).toBe("fr");
    expect(state.theme).toBe("light");
    expect(state.featureFlags).toEqual({ beta: true });
  });

  it("resets to the initial state", () => {
    useAppStore.getState().setAuthToken("abc");
    useAppStore.getState().setLocale("fr");

    useAppStore.getState().reset();

    expect(useAppStore.getState()).toMatchObject({
      userId: null,
      isAuthenticated: false,
      authToken: null,
      locale: "rw",
      theme: "dark",
    });
  });
});
