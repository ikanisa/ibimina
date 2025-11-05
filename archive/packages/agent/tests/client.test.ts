import { describe, it, expect, vi, beforeEach } from "vitest";
import { AgentClient } from "../src/client";
import type { SupabaseLikeClient } from "../src/types";

declare const Response: typeof globalThis.Response;

type RpcHandler = (fn: string, args: Record<string, unknown>) => Promise<{
  data: unknown;
  error: { message?: string } | null;
}>;

const createSupabaseStub = (rpcImpl: RpcHandler): SupabaseLikeClient => {
  const profileBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: { lang: "rw" }, error: null }),
    single: vi.fn().mockResolvedValue({ data: { lang: "rw" }, error: null }),
  };

  return {
    rpc: vi.fn(rpcImpl),
    from: vi.fn((table: string) => {
      if (table === "members_app_profiles") {
        return profileBuilder;
      }
      throw new Error(`Unexpected table ${table}`);
    }),
  };
};

const createSseResponse = (events: Array<Record<string, unknown>>): Response => {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }
      controller.close();
    },
  });

  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
  });
};

describe("AgentClient", () => {
  const defaultRpc: RpcHandler = async (fn, args) => {
    if (fn === "agent_resolve_org_scope") {
      return {
        data: [{ org_id: args.p_org ?? "org-1", org_name: "Ikimina Coop", country_code: "RW" }],
        error: null,
      };
    }
    if (fn === "agent_kb_search") {
      return { data: [], error: null };
    }
    if (fn === "agent_allocations_read_mine") {
      return { data: [], error: null };
    }
    if (fn === "agent_reference_generate") {
      return { data: [{ token: "RWA.NYA.IBI.0001.123", expires_at: "2025-02-16T12:00:00Z" }], error: null };
    }
    if (fn === "agent_tickets_create") {
      return { data: [{ ticket_id: "ticket-1", status: "open", submitted_at: "2025-02-15T10:00:00Z", summary: "done" }], error: null };
    }
    throw new Error(`Unexpected RPC ${fn}`);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("streams assistant response without tool calls", async () => {
    const supabase = createSupabaseStub(defaultRpc);

    const fetchStub = vi.fn(async () =>
      createSseResponse([
        { type: "response.created", response: { id: "resp_1" } },
        { type: "response.output_text.delta", delta: { text: "Muraho!" } },
        {
          type: "response.output_text.done",
          response: { output: [{ content: [{ type: "output_text", text: "Muraho!" }] }] },
        },
        { type: "response.completed" },
      ])
    );

    const events: Array<{ type: string; [key: string]: unknown }> = [];

    const client = new AgentClient({
      supabase,
      apiKey: "test-key",
      fetch: fetchStub,
    });

    const result = await client.streamConversation({
      messages: [{ role: "user", content: "Muraho" }],
      user: { id: "user-1" },
      locale: "rw",
      onEvent: (event) => {
        events.push(event);
      },
    });

    expect(fetchStub).toHaveBeenCalledTimes(1);
    expect(result.text).toBe("Muraho!");
    expect(events.find((event) => event.type === "metadata")).toBeTruthy();
    expect(events.filter((event) => event.type === "token").length).toBeGreaterThan(0);
    expect(events.some((event) => event.type === "message")).toBe(true);
    expect(events.some((event) => event.type === "done")).toBe(true);
  });

  it("executes tool calls and streams final response", async () => {
    const rpcSpy = vi.fn(async (fn: string, args: Record<string, unknown>) => {
      if (fn === "agent_kb_search") {
        return {
          data: [
            { id: "kb-1", title: "Policy", language_code: "en", content: "Details", tags: [], policy_tag: null },
          ],
          error: null,
        };
      }
      return defaultRpc(fn, args);
    });

    const supabase = createSupabaseStub(rpcSpy);

    const fetchStub = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("tool_outputs")) {
        return createSseResponse([
          { type: "response.output_text.delta", delta: { text: "Here you go." } },
          {
            type: "response.output_text.done",
            response: { output: [{ content: [{ type: "output_text", text: "Here you go." }] }] },
          },
          { type: "response.completed" },
        ]);
      }

      return createSseResponse([
        { type: "response.created", response: { id: "resp_2" } },
        {
          type: "response.required_action",
          response: { id: "resp_2" },
          required_action: {
            type: "submit_tool_outputs",
            submit_tool_outputs: {
              tool_calls: [
                {
                  id: "call_1",
                  type: "function",
                  function: {
                    name: "kb.search",
                    arguments: JSON.stringify({ query: "What is policy?", language: "en" }),
                  },
                },
              ],
            },
          },
        },
      ]);
    });

    const client = new AgentClient({
      supabase,
      apiKey: "test-key",
      fetch: fetchStub,
    });

    const embeddingsSpy = vi.fn().mockResolvedValue({ data: [{ embedding: [0.1, 0.2, 0.3] }] });
    (client as unknown as { openai: { embeddings: { create: ReturnType<typeof vi.fn> } } }).openai.embeddings.create = embeddingsSpy;

    const events: Array<{ type: string; [key: string]: unknown }> = [];

    const result = await client.streamConversation({
      messages: [{ role: "user", content: "Tell me about policy" }],
      user: { id: "user-1" },
      onEvent: (event) => {
        events.push(event);
      },
    });

    expect(fetchStub).toHaveBeenCalledTimes(2);
    expect(embeddingsSpy).toHaveBeenCalled();
    expect(rpcSpy).toHaveBeenCalledWith(
      "agent_kb_search",
      expect.objectContaining({ p_user: "user-1", match_limit: 5 })
    );
    expect(events.some((event) => event.type === "tool_result")).toBe(true);
    expect(result.text).toContain("Here you go.");
  });
});
