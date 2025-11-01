import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import {
  createWhatsAppHandler,
  FeatureFlag,
  type FeatureFlagService,
  type WhatsAppTransport,
} from "../whatsapp/index.js";

function getCalls(fn: unknown) {
  const mockState = (fn as { mock?: { calls?: Array<{ arguments: unknown[] }> } }).mock;
  return mockState?.calls ?? [];
}

describe("WhatsApp handler", () => {
  let transport: WhatsAppTransport;
  let featureFlags: FeatureFlagService;
  let featureFlagMock: ReturnType<typeof mock.fn>;

  beforeEach(() => {
    transport = {
      sendAutomatedReply: mock.fn(async () => undefined),
      markAsRead: mock.fn(async () => undefined),
    };

    featureFlagMock = mock.fn(async () => true);
    featureFlags = {
      isEnabled: featureFlagMock,
    };
  });

  it("returns 403 when feature flag is disabled", async () => {
    featureFlagMock.mock.mockImplementation(async () => false);

    const handler = createWhatsAppHandler({ featureFlags, transport });
    const result = await handler.handleWebhook({ entry: [] });

    assert.equal(result.ok, false);
    assert.equal(result.status, 403);
    assert.equal(result.details, "feature_flag_disabled");
    assert.equal(result.processed.inboundMessages, 0);
    assert.equal(result.processed.statusUpdates, 0);
    assert.equal(getCalls(transport.markAsRead).length, 0);
    assert.equal(getCalls(transport.sendAutomatedReply).length, 0);
  });

  it("marks inbound text messages read and sends automated reply", async () => {
    const handler = createWhatsAppHandler({ featureFlags, transport });

    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    id: "wamid.HBgM123",
                    from: "250788123456",
                    type: "text",
                    text: { body: "Hello" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const result = await handler.handleWebhook(payload);

    assert.equal(result.ok, true);
    assert.equal(result.status, 200);
    assert.equal(result.processed.inboundMessages, 1);
    assert.equal(result.processed.statusUpdates, 0);

    const markCalls = getCalls(transport.markAsRead);
    assert.equal(markCalls.length, 1);
    assert.equal(markCalls[0].arguments[0], "wamid.HBgM123");

    const replyCalls = getCalls(transport.sendAutomatedReply);
    assert.equal(replyCalls.length, 1);
    assert.equal(replyCalls[0].arguments[0].to, "250788123456");
    assert.ok(replyCalls[0].arguments[0].body.includes("Murakoze"));
    assert.equal(replyCalls[0].arguments[0].context?.messageId, "wamid.HBgM123");
  });

  it("counts status updates without invoking transport", async () => {
    const handler = createWhatsAppHandler({ featureFlags, transport });

    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  { id: "wamid.ABCD", status: "delivered" },
                  { id: "wamid.ABCD", status: "read" },
                ],
              },
            },
          ],
        },
      ],
    };

    const result = await handler.handleWebhook(payload);

    assert.equal(result.ok, true);
    assert.equal(result.status, 200);
    assert.equal(result.processed.inboundMessages, 0);
    assert.equal(result.processed.statusUpdates, 2);
    assert.equal(getCalls(transport.markAsRead).length, 0);
    assert.equal(getCalls(transport.sendAutomatedReply).length, 0);
  });
});
