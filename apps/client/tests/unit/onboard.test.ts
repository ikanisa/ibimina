import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { submitOnboardingData, checkProfileExists } from "../../lib/api/onboard.js";
import type { OnboardingData, OnboardingResponse, OnboardingError } from "../../lib/api/onboard.js";

describe("submitOnboardingData", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("submits onboarding data successfully", async () => {
    const mockResponse: OnboardingResponse = {
      success: true,
      data: {
        user_id: "user-123",
        whatsapp_msisdn: "+250788123456",
        momo_msisdn: "+250788123456",
        lang: "en",
        created_at: "2025-10-27T10:00:00Z",
      },
    };

    const requests: Array<{ input: RequestInfo | URL; init: RequestInit | undefined }> = [];
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ input, init });
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    const data: OnboardingData = {
      whatsapp_msisdn: "+250788123456",
      momo_msisdn: "+250788123456",
    };

    const result = await submitOnboardingData(data);

    assert.equal(requests.length, 1);
    assert.equal(requests[0].input, "/api/onboard");
    assert.equal(requests[0].init?.method, "POST");
    assert.equal(requests[0].init?.credentials, "include");

    const headers = new Headers(requests[0].init?.headers);
    assert.equal(headers.get("content-type"), "application/json");

    const body = JSON.parse(requests[0].init?.body as string);
    assert.deepEqual(body, data);

    assert.deepEqual(result, mockResponse);
  });

  it("includes optional language parameter", async () => {
    const requests: Array<{ input: RequestInfo | URL; init: RequestInit | undefined }> = [];
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ input, init });
      return new Response(JSON.stringify({ success: true, data: {} }), {
        status: 200,
      });
    };

    const data: OnboardingData = {
      whatsapp_msisdn: "+250788123456",
      momo_msisdn: "+250788654321",
      lang: "rw",
    };

    await submitOnboardingData(data);

    const body = JSON.parse(requests[0].init?.body as string);
    assert.equal(body.lang, "rw");
  });

  it("throws an error when server returns 400", async () => {
    const errorResponse: OnboardingError = {
      error: "validation_error",
      details: "Invalid phone number format",
    };

    globalThis.fetch = async () => {
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    };

    const data: OnboardingData = {
      whatsapp_msisdn: "invalid",
      momo_msisdn: "invalid",
    };

    await assert.rejects(submitOnboardingData(data), {
      name: "Error",
      message: "Invalid phone number format",
    });
  });

  it("throws an error when server returns 409 (conflict)", async () => {
    const errorResponse: OnboardingError = {
      error: "profile_exists",
      details: "Profile already exists for this user",
    };

    globalThis.fetch = async () => {
      return new Response(JSON.stringify(errorResponse), {
        status: 409,
        headers: { "content-type": "application/json" },
      });
    };

    const data: OnboardingData = {
      whatsapp_msisdn: "+250788123456",
      momo_msisdn: "+250788123456",
    };

    await assert.rejects(submitOnboardingData(data), {
      name: "Error",
      message: "Profile already exists for this user",
    });
  });

  it("handles network errors gracefully", async () => {
    globalThis.fetch = async () => {
      throw new TypeError("Failed to fetch");
    };

    const data: OnboardingData = {
      whatsapp_msisdn: "+250788123456",
      momo_msisdn: "+250788123456",
    };

    await assert.rejects(submitOnboardingData(data), {
      name: "Error",
      message: /Network error: Unable to connect to the server/,
    });
  });

  it("throws original error for non-TypeError exceptions", async () => {
    globalThis.fetch = async () => {
      throw new Error("Custom error");
    };

    const data: OnboardingData = {
      whatsapp_msisdn: "+250788123456",
      momo_msisdn: "+250788123456",
    };

    await assert.rejects(submitOnboardingData(data), {
      name: "Error",
      message: "Custom error",
    });
  });

  it("handles error response without details", async () => {
    const errorResponse = {
      error: "unknown_error",
      details: "",
    };

    globalThis.fetch = async () => {
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    };

    const data: OnboardingData = {
      whatsapp_msisdn: "+250788123456",
      momo_msisdn: "+250788123456",
    };

    await assert.rejects(submitOnboardingData(data), {
      name: "Error",
      message: "unknown_error",
    });
  });
});

describe("checkProfileExists", () => {
  it("returns false (placeholder implementation)", async () => {
    const result = await checkProfileExists();
    assert.equal(result, false);
  });
});
