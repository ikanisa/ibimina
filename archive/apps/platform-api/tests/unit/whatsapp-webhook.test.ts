import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

import {
  hashBody,
  processWebhookPayload,
  verifyMetaSignature,
} from "../../src/webhooks/whatsapp.js";

describe("verifyMetaSignature", () => {
  it("accepts valid signatures", () => {
    const secret = "app-secret";
    const payload = Buffer.from('{"hello":"world"}');
    const digest = createHmac("sha256", secret).update(payload).digest("hex");

    const result = verifyMetaSignature(secret, payload, `sha256=${digest}`);
    assert.equal(result.ok, true);
  });

  it("rejects mismatched signatures", () => {
    const secret = "app-secret";
    const payload = Buffer.from("test");
    const result = verifyMetaSignature(secret, payload, "sha256=deadbeef");

    assert.equal(result.ok, false);
    assert.equal(result.reason, "mismatch");
  });

  it("handles missing headers", () => {
    const secret = "app-secret";
    const payload = Buffer.from("test");
    const result = verifyMetaSignature(secret, payload, undefined);

    assert.equal(result.ok, false);
    assert.equal(result.reason, "missing");
  });
});

describe("processWebhookPayload", () => {
  it("extracts delivery records and flags failures", () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [{ id: "wamid.A", type: "text" }],
                statuses: [
                  {
                    id: "wamid.A",
                    status: "delivered",
                    timestamp: "1700000000",
                    recipient_id: "250788000000",
                  },
                  {
                    id: "wamid.B",
                    status: "failed",
                    timestamp: "1700000001",
                    errors: [
                      {
                        code: "131026",
                        title: "Unknown destination",
                        message: "Recipient unavailable",
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const result = processWebhookPayload(payload);

    assert.equal(result.inboundMessages, 1);
    assert.equal(result.statuses.length, 2);
    assert.equal(result.failures.length, 1);
    assert.equal(result.failures[0].failure_reason, "Recipient unavailable");
  });
});

describe("hashBody", () => {
  it("produces a deterministic sha256 hash", () => {
    const bytes = Buffer.from("payload");
    const first = hashBody(bytes);
    const second = hashBody(bytes);

    assert.equal(first, second);
    assert.match(first, /^[0-9a-f]{64}$/);
  });
});
