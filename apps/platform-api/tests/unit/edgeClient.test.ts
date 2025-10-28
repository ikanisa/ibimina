import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { invokeEdge, requireEnv } from "../../src/lib/edgeClient.js";

describe("requireEnv", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns the value when environment variable is set", () => {
    process.env = { ...originalEnv, TEST_VAR: "test-value" };
    const result = requireEnv("TEST_VAR");
    assert.equal(result, "test-value");
  });

  it("throws an error when environment variable is missing", () => {
    process.env = { ...originalEnv };
    delete process.env.MISSING_VAR;
    assert.throws(
      () => requireEnv("MISSING_VAR"),
      {
        name: "Error",
        message: "Missing required environment variable: MISSING_VAR",
      }
    );
  });

  it("throws an error when environment variable is empty string", () => {
    process.env = { ...originalEnv, EMPTY_VAR: "" };
    assert.throws(
      () => requireEnv("EMPTY_VAR"),
      {
        name: "Error",
        message: "Missing required environment variable: EMPTY_VAR",
      }
    );
  });
});

describe("invokeEdge", () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SUPABASE_URL: "https://test.supabase.co",
      HMAC_SHARED_SECRET: "test-secret",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  });

  it("makes a GET request by default", async () => {
    const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({
        url: input.toString(),
        init,
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    const result = await invokeEdge("test-function");

    assert.equal(requests.length, 1);
    assert.equal(requests[0].init?.method, "GET");
    assert.ok(requests[0].url.includes("/functions/v1/test-function"));
    assert.deepEqual(result, { success: true });
  });

  it("makes a POST request when body is provided", async () => {
    const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({
        url: input.toString(),
        init,
      });
      return new Response(JSON.stringify({ data: "created" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    };

    const result = await invokeEdge("create-resource", {
      body: { name: "test" },
    });

    assert.equal(requests.length, 1);
    assert.equal(requests[0].init?.method, "POST");
    assert.deepEqual(result, { data: "created" });
  });

  it("includes HMAC signature in request headers", async () => {
    const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({
        url: input.toString(),
        init,
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    };

    await invokeEdge("secure-function", { body: { data: "test" } });

    assert.equal(requests.length, 1);
    const headers = new Headers(requests[0].init?.headers);
    assert.ok(headers.get("x-signature"));
    assert.ok(headers.get("x-timestamp"));
    assert.equal(headers.get("content-type"), "application/json");
  });

  it("respects custom timeout", async () => {
    let aborted = false;
    globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      return new Promise((resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          aborted = true;
          reject(new Error("Request aborted"));
        });
        // Simulate slow response
        setTimeout(() => resolve(new Response("{}", { status: 200 })), 100);
      });
    };

    await assert.rejects(
      invokeEdge("slow-function", { timeoutMs: 50 }),
      /abort/i
    );
    assert.ok(aborted);
  });

  it("throws an error when response is not ok", async () => {
    globalThis.fetch = async () => {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        statusText: "Not Found",
      });
    };

    await assert.rejects(
      invokeEdge("missing-function"),
      /Edge invocation failed \(404\): Not found/
    );
  });

  it("handles non-JSON responses", async () => {
    globalThis.fetch = async () => {
      return new Response("Plain text response", {
        status: 200,
      });
    };

    const result = await invokeEdge("text-function");
    assert.equal(result, "Plain text response");
  });

  it("uses custom base URL when EDGE_FUNCTION_BASE_URL is set", async () => {
    process.env = {
      ...originalEnv,
      EDGE_FUNCTION_BASE_URL: "https://custom.edge.io/api/",
      HMAC_SHARED_SECRET: "test-secret",
    };

    const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({
        url: input.toString(),
        init,
      });
      return new Response("{}", { status: 200 });
    };

    await invokeEdge("custom-function");

    assert.equal(requests.length, 1);
    assert.ok(requests[0].url.includes("https://custom.edge.io/api/custom-function"));
  });
});
