let apiFetch: typeof import("@/services/api/client").apiFetch;
let ApiErrorCtor: typeof import("@/services/api/client").ApiError;
let store: typeof import("@/providers/store").useAppStore;

const originalFetch = global.fetch;

beforeEach(() => {
  jest.resetModules();
  process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.example.com";
  const storeModule = require("@/providers/store");
  store = storeModule.useAppStore;
  store.setState({ authToken: "token-123" } as any);
  const clientModule = require("@/services/api/client");
  apiFetch = clientModule.apiFetch;
  ApiErrorCtor = clientModule.ApiError;
  global.fetch = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

describe("apiFetch", () => {
  it("attaches JSON headers and the bearer token when auth is included", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => ({ data: "ok" }),
    });

    const response = await apiFetch("/endpoint", {
      method: "POST",
      body: JSON.stringify({ hello: "world" }),
    });

    expect(global.fetch).toHaveBeenCalledWith("https://api.example.com/endpoint", {
      method: "POST",
      body: JSON.stringify({ hello: "world" }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer token-123",
      },
    });
    expect(response).toEqual({ data: "ok" });
  });

  it("omits the Authorization header when includeAuth is false", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => ({ data: "ok" }),
    });

    const response = await apiFetch("/public", {
      method: "GET",
      includeAuth: false,
    });

    expect(global.fetch).toHaveBeenCalledWith("https://api.example.com/public", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    expect(response).toEqual({ data: "ok" });
  });

  it("returns undefined for 204 responses", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 204,
      headers: { get: () => "application/json" },
    });

    const response = await apiFetch("/no-content");

    expect(response).toBeUndefined();
  });

  it("throws an ApiError with the parsed response body on failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      headers: { get: () => "text/plain" },
      text: async () => "Service unavailable",
    });

    await expect(apiFetch("/fail", { method: "GET" })).rejects.toMatchObject<ApiErrorCtor>({
      status: 500,
      message: "Request failed with status 500",
      body: "Service unavailable",
    });
  });

  it("throws a helpful error when the base URL is missing", async () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    jest.resetModules();
    jest.doMock("expo-constants", () => ({}));
    await jest.isolateModulesAsync(async () => {
      const { apiFetch: isolatedApiFetch } = require("@/services/api/client");
      await expect(isolatedApiFetch("/anything")).rejects.toThrow(
        "Missing API base URL configuration"
      );
    });
    jest.dontMock("expo-constants");
  });
});
