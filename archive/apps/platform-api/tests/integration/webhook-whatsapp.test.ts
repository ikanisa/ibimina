import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it, beforeEach, afterEach } from "node:test";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { SupabaseClient } from "@supabase/supabase-js";

interface TestResponse<T = unknown> {
  statusCode: number;
  body?: T;
  headers: Record<string, string>;
  status: (code: number) => TestResponse<T>;
  json: (payload: T) => TestResponse<T>;
  send: (payload: T) => TestResponse<T>;
  setHeader: (name: string, value: string) => TestResponse<T>;
}

const createResponse = <T = unknown>(): TestResponse<T> & VercelResponse => {
  const headers: Record<string, string> = {};
  const response: TestResponse<T> = {
    statusCode: 200,
    body: undefined,
    headers,
    status(code) {
      response.statusCode = code;
      return response;
    },
    json(payload) {
      response.body = payload;
      return response;
    },
    send(payload) {
      response.body = payload;
      return response;
    },
    setHeader(name, value) {
      headers[name] = value;
      return response;
    },
  };

  return response as TestResponse<T> & VercelResponse;
};

interface TestRequestInit {
  method: string;
  headers?: Record<string, string>;
  query?: Record<string, unknown>;
  body?: string;
  url?: string;
}

const createRequest = (init: TestRequestInit): VercelRequest =>
  ({
    method: init.method,
    headers: init.headers ?? {},
    query: init.query ?? {},
    body: init.body,
    url: init.url ?? "/api/webhook/whatsapp",
  }) as unknown as VercelRequest;

const requireTestEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Expected ${key} to be defined in test environment`);
  }
  return value;
};

type TestGlobal = typeof globalThis & {
  __TEST_SUPABASE_CLIENT__?: SupabaseClient | null;
};

const stubSupabase = (options?: { upsertError?: string }) => {
  const client = {
    schema: () => ({
      from: () => ({
        upsert: async () =>
          options?.upsertError ? { error: { message: options.upsertError } } : { error: null },
      }),
    }),
  } as unknown as SupabaseClient;

  (globalThis as TestGlobal).__TEST_SUPABASE_CLIENT__ = client;
};

const toSignature = (secret: string, body: string) => {
  const digest = createHmac("sha256", secret).update(body).digest("hex");
  return `sha256=${digest}`;
};

describe("WhatsApp webhook handler", () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      META_WHATSAPP_APP_SECRET: "test-app-secret",
      META_WHATSAPP_VERIFY_TOKEN: "verify-me",
      WHATSAPP_ALERT_WEBHOOK: "https://alerts.example.com/webhook",
    };

    globalThis.fetch = async () => new Response(null, { status: 204 });
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
    (globalThis as TestGlobal).__TEST_SUPABASE_CLIENT__ = undefined;
  });

  it("rejects malformed verification requests", async () => {
    stubSupabase();
    const { default: handler } = await import("../../api/webhook/whatsapp.js");

    const res = createResponse();

    await handler(createRequest({ method: "GET", query: {}, headers: {} }), res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { error: "Unsupported verification request" });
  });

  it("rejects verification requests with an invalid token", async () => {
    stubSupabase();
    const { default: handler } = await import("../../api/webhook/whatsapp.js");

    const res = createResponse();

    await handler(
      createRequest({
        method: "GET",
        query: {
          "hub.mode": "subscribe",
          "hub.challenge": "challenge-token",
          "hub.verify_token": "bad-token",
        },
        headers: {},
      }),
      res
    );

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { error: "Invalid verification token" });
  });

  it("returns 403 when signature validation fails", async () => {
    stubSupabase();
    const { default: handler } = await import("../../api/webhook/whatsapp.js");

    const res = createResponse();
    const body = JSON.stringify({ entry: [] });

    await handler(
      createRequest({
        method: "POST",
        headers: {},
        body,
        query: {},
      }),
      res
    );

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { error: "Invalid signature" });
  });

  it("rejects payloads that fail validation", async () => {
    stubSupabase();
    const { default: handler } = await import("../../api/webhook/whatsapp.js");

    const res = createResponse();
    const body = JSON.stringify({
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  {
                    status: 5,
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    const appSecret = requireTestEnv("META_WHATSAPP_APP_SECRET");

    await handler(
      createRequest({
        method: "POST",
        headers: {
          "x-hub-signature-256": toSignature(appSecret, body),
        },
        body,
        query: {},
      }),
      res
    );

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { error: "Invalid webhook payload" });
  });

  it("persists statuses and responds with processing summary", async () => {
    const fetchCalls: Array<{ url: string }> = [];
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = input.toString();
      fetchCalls.push({ url });
      return new Response(null, { status: 204 });
    };

    stubSupabase();
    const module = await import("../../api/webhook/whatsapp.js");
    const handler = module.default;

    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [{}],
                statuses: [
                  {
                    id: "message-1",
                    status: "delivered",
                    timestamp: "1700000000",
                    recipient_id: "2507",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const body = JSON.stringify(payload);
    const res = createResponse();

    const appSecret = requireTestEnv("META_WHATSAPP_APP_SECRET");

    await handler(
      createRequest({
        method: "POST",
        headers: {
          "x-hub-signature-256": toSignature(appSecret, body),
        },
        body,
        query: {},
      }),
      res
    );

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      ok: true,
      inboundMessages: 1,
      statuses: 1,
      failures: 0,
    });
    assert.equal(fetchCalls.length, 0);
  });

  it("propagates persistence failures", async () => {
    stubSupabase({ upsertError: "database unavailable" });
    const { default: handler } = await import("../../api/webhook/whatsapp.js");

    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  {
                    id: "message-1",
                    status: "failed",
                    timestamp: "1700000000",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const body = JSON.stringify(payload);
    const res = createResponse();

    const appSecret = requireTestEnv("META_WHATSAPP_APP_SECRET");

    await handler(
      createRequest({
        method: "POST",
        headers: {
          "x-hub-signature-256": toSignature(appSecret, body),
        },
        body,
        query: {},
      }),
      res
    );

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { error: "Failed to persist statuses" });
  });
});
