import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatUI } from "@/components/chat/ChatUI";

const encoder = new TextEncoder();

type MockEvent = {
  payload: unknown;
  delay?: number;
};

function createMockResponse(events: MockEvent[]) {
  return new Response(
    new ReadableStream<Uint8Array>({
      async start(controller) {
        for (const event of events) {
          controller.enqueue(
            encoder.encode(`event: message\ndata: ${JSON.stringify(event.payload)}\n\n`)
          );
          if (event.delay) {
            await new Promise((resolve) => setTimeout(resolve, event.delay));
          }
        }
        controller.close();
      },
    }),
    {
      headers: { "Content-Type": "text/event-stream" },
    }
  );
}

describe("ChatUI", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
  });

  it("streams agent responses via SSE", async () => {
    const events: MockEvent[] = [
      { payload: { type: "message-start", messageId: "assistant-test" } },
      {
        payload: { type: "message-delta", messageId: "assistant-test", delta: "Muraho" },
        delay: 5,
      },
      { payload: { type: "message-delta", messageId: "assistant-test", delta: " neza" }, delay: 5 },
      { payload: { type: "message-end", messageId: "assistant-test" } },
    ];

    global.fetch = async (_input, init) => {
      const body = init?.body ? JSON.parse(init.body as string) : {};
      assert.equal(body.locale, "en");
      return createMockResponse(events);
    };

    render(<ChatUI initialLocale="en" />);

    const composer = screen.getByPlaceholderText(/message sacco\+ agent/i);
    await userEvent.type(composer, "Hello");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      assert.ok(screen.getByText(/Muraho neza/));
    });
  });

  it("updates quick action labels when switching languages", async () => {
    render(<ChatUI initialLocale="en" />);

    // Switch to French
    await userEvent.click(screen.getByRole("button", { name: "FR" }));
    await waitFor(() => {
      assert.ok(screen.getByRole("button", { name: /relevés/i }));
    });

    // Switch back to Kinyarwanda
    await userEvent.click(screen.getByRole("button", { name: "RW" }));
    await waitFor(() => {
      assert.ok(screen.getByRole("button", { name: /raporo/i }));
    });
  });
});
