import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

/**
 * Integration tests for MoMo poller worker
 *
 * These tests validate the interaction between the worker and edge functions,
 * mocking only external dependencies (Supabase, fetch).
 */
describe("MoMo poller worker integration", () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
      HMAC_SHARED_SECRET: "test-secret",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  });

  it("invokes edge function and queries polling status", async () => {
    const { runMomoPoller } = await import("../../src/workers/momo-poller.js");

    const fetchCalls: Array<{ url: string; init: RequestInit | undefined }> = [];

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      fetchCalls.push({ url, init });

      // Mock edge function response
      if (url.includes("momo-statement-poller")) {
        return new Response(
          JSON.stringify({
            success: true,
            processed: 150,
            inserted: 120,
            jobs: 3,
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      // Mock Supabase query response
      if (url.includes("/rest/v1/momo_statement_pollers")) {
        return new Response(
          JSON.stringify([
            {
              display_name: "MTN MoMo",
              provider: "MTN",
              last_polled_at: "2025-10-27T10:00:00Z",
              last_latency_ms: 250,
              last_error: null,
              last_polled_count: 50,
            },
            {
              display_name: "Airtel Money",
              provider: "AIRTEL",
              last_polled_at: "2025-10-27T10:01:00Z",
              last_latency_ms: 180,
              last_error: null,
              last_polled_count: 70,
            },
          ]),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      return new Response("{}", { status: 200 });
    };

    await runMomoPoller();

    // Verify edge function was called
    const edgeCalls = fetchCalls.filter((call) => call.url.includes("momo-statement-poller"));
    assert.equal(edgeCalls.length, 1);
    assert.equal(edgeCalls[0].init?.method, "POST");

    // Verify Supabase query was made
    const supabaseCalls = fetchCalls.filter((call) => call.url.includes("momo_statement_pollers"));
    assert.equal(supabaseCalls.length, 1);
  });

  it("throws an error when edge function fails", async () => {
    const { runMomoPoller } = await import("../../src/workers/momo-poller.js");

    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url.includes("momo-statement-poller")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Database connection failed",
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      return new Response("{}", { status: 200 });
    };

    await assert.rejects(runMomoPoller(), {
      name: "Error",
      message: /MoMo polling failed: Database connection failed/,
    });
  });

  it("handles missing edge function response gracefully", async () => {
    const { runMomoPoller } = await import("../../src/workers/momo-poller.js");

    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url.includes("momo-statement-poller")) {
        return new Response(
          JSON.stringify({
            success: false,
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      return new Response("{}", { status: 200 });
    };

    await assert.rejects(runMomoPoller(), {
      name: "Error",
      message: /MoMo polling failed: unknown error/,
    });
  });
});

/**
 * Integration tests for GSM heartbeat worker
 *
 * Tests the worker's interaction with edge functions and external services.
 */
describe("GSM heartbeat worker integration", () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
      HMAC_SHARED_SECRET: "test-secret",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  });

  it("invokes edge function successfully", async () => {
    const { runGsmHeartbeat } = await import("../../src/workers/gsm-heartbeat.js");

    const fetchCalls: Array<{ url: string; init: RequestInit | undefined }> = [];

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      fetchCalls.push({ url, init });

      // Mock edge function response
      if (url.includes("gsm-heartbeat")) {
        return new Response(
          JSON.stringify({
            success: true,
            checked: 5,
            healthy: 4,
            unhealthy: 1,
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      return new Response("{}", { status: 200 });
    };

    await runGsmHeartbeat();

    // Verify edge function was called
    const edgeCalls = fetchCalls.filter((call) => call.url.includes("gsm-heartbeat"));
    assert.equal(edgeCalls.length, 1);
    assert.equal(edgeCalls[0].init?.method, "POST");
  });

  it("throws an error when edge function reports failure", async () => {
    const { runGsmHeartbeat } = await import("../../src/workers/gsm-heartbeat.js");

    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url.includes("gsm-heartbeat")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "GSM device unreachable",
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      return new Response("{}", { status: 200 });
    };

    await assert.rejects(runGsmHeartbeat(), {
      name: "Error",
      message: /GSM heartbeat failed: GSM device unreachable/,
    });
  });
});
