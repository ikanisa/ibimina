import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";

const originalFetch = globalThis.fetch;

function clearServiceEnv() {
  delete process.env.CONFIGCAT_SDK_KEY;
  delete process.env.FLAGSMITH_ENVIRONMENT_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  Object.keys(process.env).forEach((key) => {
    if (key.startsWith("NEXT_PUBLIC_FEATURE_FLAG_")) {
      delete process.env[key];
    }
  });
}

describe("Feature flag service", () => {
  beforeEach(() => {
    clearServiceEnv();
    globalThis.fetch = originalFetch;
  });

  afterEach(() => {
    clearServiceEnv();
    globalThis.fetch = originalFetch;
  });

  it("loads flags from ConfigCat when SDK key is provided", async () => {
    process.env.CONFIGCAT_SDK_KEY = "sdk-key";
    process.env.NEXT_PUBLIC_FEATURE_FLAG_LOANS_ENABLED = "1";

    let requestCount = 0;

    globalThis.fetch = async (input: RequestInfo | URL) => {
      requestCount += 1;
      assert.ok(String(input).includes("config_v2.json"));

      return new Response(
        JSON.stringify({
          f: {
            AdvancedModules: { v: true },
            LoansEnabled: { v: false },
          },
        })
      );
    };

    const { loadFeatureFlags } = await import(`@/lib/feature-flags/service?ts=${Date.now()}`);
    const flags = await loadFeatureFlags();

    assert.strictEqual(requestCount, 1);
    assert.strictEqual(flags["advanced-modules"], true);
    // Remote flag overrides env default of true -> false
    assert.strictEqual(flags["loans-enabled"], false);
  });

  it("loads flags from Flagsmith when environment key is set", async () => {
    process.env.FLAGSMITH_ENVIRONMENT_KEY = "env-key";

    globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string> | undefined;
      assert.strictEqual(headers?.Authorization, "env-key");

      return new Response(
        JSON.stringify([
          { feature: { name: "AdvancedModules" }, enabled: false, value: "true" },
          { feature: { name: "WalletEnabled" }, enabled: true, value: "false" },
        ])
      );
    };

    const { loadFeatureFlags } = await import(`@/lib/feature-flags/service?ts=${Date.now()}`);
    const flags = await loadFeatureFlags();

    assert.strictEqual(flags["advanced-modules"], true);
    assert.strictEqual(flags["wallet-enabled"], false);
  });

  it("falls back to Supabase configuration when service role key exists", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl = String(input);
      assert.ok(requestUrl.includes("/rest/v1/feature_flags"));
      const headers = init?.headers as Record<string, string> | undefined;
      assert.strictEqual(headers?.Authorization, "Bearer service-role");
      assert.strictEqual(headers?.apikey, "anon-key");

      return new Response(
        JSON.stringify([
          { key: "AdvancedModules", is_enabled: true },
          { key: "LoansEnabled", is_enabled: true },
          { key: "WalletEnabled", is_enabled: false },
        ]),
        { headers: { "content-type": "application/json" } }
      );
    };

    const { loadFeatureFlags } = await import(`@/lib/feature-flags/service?ts=${Date.now()}`);
    const flags = await loadFeatureFlags();

    assert.strictEqual(flags["advanced-modules"], true);
    assert.strictEqual(flags["loans-enabled"], true);
    assert.strictEqual(flags["wallet-enabled"], false);
  });

  it("returns environment defaults when remote providers fail", async () => {
    process.env.CONFIGCAT_SDK_KEY = "sdk-key";
    process.env.NEXT_PUBLIC_FEATURE_FLAG_ADVANCED_MODULES = "true";

    globalThis.fetch = async () => {
      return new Response("", { status: 500 });
    };

    const { loadFeatureFlags } = await import(`@/lib/feature-flags/service?ts=${Date.now()}`);
    const flags = await loadFeatureFlags();

    assert.strictEqual(flags["advanced-modules"], true);
  });
});
