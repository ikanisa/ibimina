import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { streamSSE } from "@/lib/chat/sse";

const encoder = new TextEncoder();

describe("streamSSE", () => {
  it("parses sequential SSE events", async () => {
    const chunks = [
      'event: message\ndata: {"type":"message-start","messageId":"1"}\n\n',
      'event: message\ndata: {"type":"message-delta","messageId":"1","delta":"Muraho"}\n\n',
      'event: message\ndata: {"type":"message-end","messageId":"1"}\n\n',
    ];

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
        controller.close();
      },
    });

    const response = new Response(stream);
    const payloads: unknown[] = [];

    await streamSSE({
      response,
      onMessage(message) {
        payloads.push(message.data);
      },
    });

    assert.equal(payloads.length, 3);
    assert.deepEqual((payloads[0] as Record<string, unknown>).type, "message-start");
    assert.deepEqual((payloads[1] as Record<string, unknown>).type, "message-delta");
    assert.deepEqual((payloads[2] as Record<string, unknown>).type, "message-end");
  });

  it("stops reading when aborted", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        let count = 0;
        const emit = () => {
          if (cancelled) return;
          controller.enqueue(
            encoder.encode(
              `event: message\ndata: {\"type\":\"message-delta\",\"messageId\":\"x\",\"delta\":\"${count}\"}\n\n`
            )
          );
          count += 1;
          if (count < 10 && !cancelled) {
            setTimeout(emit, 10);
          }
        };
        emit();
      },
      cancel() {
        cancelled = true;
      },
    });

    const response = new Response(stream);
    const seen: unknown[] = [];
    const controller = new AbortController();

    const promise = streamSSE({
      response,
      signal: controller.signal,
      onMessage(message) {
        seen.push(message.data);
        if (seen.length === 2) {
          controller.abort();
        }
      },
    });

    await promise;

    assert.ok(seen.length <= 2);
  });
});
