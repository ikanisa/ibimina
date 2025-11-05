import { describe, it, expect, vi, beforeEach } from "vitest";
import { AgentToolbox } from "../src/toolbox";
import type { SupabaseLikeClient } from "../src/types";

describe("AgentToolbox", () => {
  const supabaseStub = {
    rpc: vi.fn(),
  } as unknown as SupabaseLikeClient;

  const embeddingsCreate = vi.fn();
  const openaiStub = {
    embeddings: {
      create: embeddingsCreate,
    },
  } as unknown as import("openai").default;

  let toolbox: AgentToolbox;

  beforeEach(() => {
    supabaseStub.rpc = vi.fn();
    embeddingsCreate.mockReset();
    toolbox = new AgentToolbox(supabaseStub, openaiStub);
  });

  it("performs knowledge base search using embeddings and RPC", async () => {
    embeddingsCreate.mockResolvedValue({ data: [{ embedding: [0.1, 0.2, 0.3] }] });
    (supabaseStub.rpc as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          id: "kb-1",
          title: "How to pay",
          language_code: "en",
          content: "Use *182#",
          tags: ["ussd"],
          policy_tag: "payments",
        },
      ],
      error: null,
    });

    const result = await toolbox.execute(
      "kb.search",
      { query: "How do I pay?", language: "en" },
      { userId: "user-1", orgId: "org-1", lang: "en" }
    );

    expect(embeddingsCreate).toHaveBeenCalledWith({ model: "text-embedding-3-large", input: "How do I pay?" });
    expect(supabaseStub.rpc).toHaveBeenCalledWith("agent_kb_search", expect.objectContaining({
      p_user: "user-1",
      target_org: "org-1",
      language_filter: "en",
      match_limit: 5,
    }));
    expect(result.kind).toBe("kb.search");
    expect(Array.isArray((result.payload as { matches: unknown[] }).matches)).toBe(true);
  });

  it("returns allocation summaries scoped to reference token", async () => {
    (supabaseStub.rpc as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          allocation_id: "alloc-1",
          amount: 12500,
          status: "CONFIRMED",
          allocated_at: "2025-02-15T10:00:00Z",
          group_name: "Ikimina",
          reference: "TOK123",
        },
      ],
      error: null,
    });

    const result = await toolbox.execute(
      "allocations.read_mine",
      { reference_token: "TOK123", limit: 10 },
      { userId: "user-1", orgId: "org-1", lang: "en" }
    );

    expect(supabaseStub.rpc).toHaveBeenCalledWith("agent_allocations_read_mine", expect.objectContaining({
      p_reference_token: "TOK123",
      p_org: "org-1",
      p_limit: 10,
    }));
    expect(result.kind).toBe("allocation");
    expect((result.payload as { allocations: unknown[] }).allocations).toHaveLength(1);
  });

  it("generates reference tokens with provided arguments", async () => {
    (supabaseStub.rpc as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [{ token: "RWA.NYA.IBI.0001.123", expires_at: "2025-02-16T12:00:00Z" }],
      error: null,
    });

    const result = await toolbox.execute(
      "reference.generate",
      { org_id: "org-1", purpose: "wallet_topup" },
      { userId: "user-1", orgId: "org-1", lang: "en" }
    );

    expect(supabaseStub.rpc).toHaveBeenCalledWith("agent_reference_generate", expect.objectContaining({
      p_org: "org-1",
      p_purpose: "wallet_topup",
    }));
    expect(result.kind).toBe("reference");
  });

  it("creates tickets and normalises payload", async () => {
    (supabaseStub.rpc as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [{
        ticket_id: "ticket-1",
        reference: "RWA.NYA.IBI.0001.123",
        status: "open",
        submitted_at: "2025-02-15T10:05:00Z",
        summary: "Need help",
      }],
      error: null,
    });

    const result = await toolbox.execute(
      "tickets.create",
      { org_id: "org-1", subject: "Help", summary: "Need help" },
      { userId: "user-1", orgId: "org-1", lang: "en" }
    );

    expect(supabaseStub.rpc).toHaveBeenCalledWith("agent_tickets_create", expect.objectContaining({
      p_subject: "Help",
      p_summary: "Need help",
    }));
    expect(result.kind).toBe("ticket");
  });
});
