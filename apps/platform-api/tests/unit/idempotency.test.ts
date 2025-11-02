import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { withWebhookIdempotency, type WebhookIdempotencyStore } from "../../src/lib/idempotency.js";

const PENDING_SENTINEL = { __ibimina_idempotency__: "pending" } as const;

describe("withWebhookIdempotency", () => {
  it("executes the operation on first invocation", async () => {
    const store: WebhookIdempotencyStore = {
      record: null as null | { response: unknown; request_hash: string; expires_at: string },
      async tryInsertPending(requestHash, expiresAt) {
        if (!this.record) {
          this.record = {
            response: PENDING_SENTINEL,
            request_hash: requestHash,
            expires_at: expiresAt,
          };
          return "inserted";
        }
        return "conflict";
      },
      async fetchRecord() {
        return this.record;
      },
      async updateRecord(response, requestHash, expiresAt) {
        this.record = { response, request_hash: requestHash, expires_at: expiresAt };
      },
      async removeRecord() {
        this.record = null;
      },
    } as WebhookIdempotencyStore & { record: any };

    let executed = 0;
    const result = await withWebhookIdempotency({
      store,
      requestHash: "hash",
      fallback: { ok: true } as const,
      operation: async () => {
        executed += 1;
        return { ok: true, payload: "value" } as const;
      },
    });

    assert.equal(result.fromCache, false);
    assert.equal(executed, 1);
    assert.deepEqual(result.data, { ok: true, payload: "value" });
  });

  it("returns cached response when duplicate request arrives", async () => {
    const sharedRecord = { response: PENDING_SENTINEL, request_hash: "hash", expires_at: "" };
    const store: WebhookIdempotencyStore = {
      state: sharedRecord,
      async tryInsertPending(requestHash, expiresAt) {
        if (this.state === sharedRecord && sharedRecord.response === PENDING_SENTINEL) {
          this.state = {
            response: PENDING_SENTINEL,
            request_hash: requestHash,
            expires_at: expiresAt,
          };
          return "inserted";
        }
        return "conflict";
      },
      async fetchRecord() {
        return this.state as any;
      },
      async updateRecord(response, requestHash, expiresAt) {
        this.state = { response, request_hash: requestHash, expires_at: expiresAt };
      },
      async removeRecord() {
        this.state = null;
      },
    } as WebhookIdempotencyStore & { state: any };

    await withWebhookIdempotency({
      store,
      requestHash: "hash",
      fallback: { ok: true } as const,
      operation: async () => ({ ok: true, result: "first" }) as const,
    });

    let executed = 0;
    const duplicate = await withWebhookIdempotency({
      store,
      requestHash: "hash",
      fallback: { ok: true } as const,
      operation: async () => {
        executed += 1;
        return { ok: true, result: "second" } as const;
      },
    });

    assert.equal(executed, 0, "duplicate operation should not execute");
    assert.equal(duplicate.fromCache, true);
    assert.deepEqual(duplicate.data, { ok: true, result: "first" });
  });

  it("returns fallback when record remains pending", async () => {
    const store: WebhookIdempotencyStore = {
      async tryInsertPending() {
        return "conflict";
      },
      async fetchRecord() {
        return { response: PENDING_SENTINEL, request_hash: "hash", expires_at: "" } as any;
      },
      async updateRecord() {
        throw new Error("should not update");
      },
      async removeRecord() {
        // no-op
      },
    };

    let timeoutTriggered = false;
    const result = await withWebhookIdempotency({
      store,
      requestHash: "hash",
      fallback: { ok: true, deduplicated: true } as const,
      onPendingTimeout: () => {
        timeoutTriggered = true;
      },
      operation: async () => ({ ok: true }) as const,
    });

    assert.equal(result.fromCache, true);
    assert.equal(result.timedOut, true);
    assert.deepEqual(result.data, { ok: true, deduplicated: true });
    assert.equal(timeoutTriggered, true);
  });
});
