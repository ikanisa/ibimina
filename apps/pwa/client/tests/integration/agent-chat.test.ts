import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import type { Response as SupertestResponse } from "supertest";
import { createAgentTestServer } from "./utils/test-server";
import {
  __setAgentOpenAIFetchForTests,
  __setAgentSupabaseFactoryForTests,
} from "@/app/api/agent/chat/route";
import { __setRateLimitClientFactoryForTests } from "@/lib/rate-limit";

const createSupabaseStub = () => {
  const profile = {
    lang: "rw",
  };

  const builderForProfile = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    async maybeSingle() {
      return { data: profile, error: null };
    },
    async single() {
      return { data: profile, error: null };
    },
  } as const;

  return {
    auth: {
      async getUser() {
        return {
          data: { user: { id: "user-123", email: "member@example.com" } },
          error: null,
        };
      },
    },
    async rpc(functionName: string) {
      if (functionName === "agent_resolve_org_scope") {
        return {
          data: [{ org_id: "org-123", org_name: "Ikimina Coop", country_code: "RW" }],
          error: null,
        };
      }
      if (functionName === "agent_reference_generate") {
        return {
          data: [{ token: "RWA.NYA.IBI.0001.123", expires_at: "2025-02-16T12:00:00Z" }],
          error: null,
        };
      }
      return { data: null, error: null };
    },
    from(table: string) {
      if (table === "members_app_profiles") {
        return builderForProfile;
      }
      throw new Error(`Unexpected table ${table}`);
    },
  } satisfies Record<string, unknown>;
};

const createSseResponse = (events: string[]) => {
  const body = events.map((event) => `data: ${event}\n\n`).join("");
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
  });
};

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test-openai-key";
  process.env.RATE_LIMIT_SECRET = "test-rate-limit";
});

afterEach(() => {
  __setAgentOpenAIFetchForTests(null);
  __setAgentSupabaseFactoryForTests(null);
  __setRateLimitClientFactoryForTests(null);
});

describe("agent chat API", () => {
  it("streams tokens and tool results", async () => {
    const supabaseStub = createSupabaseStub();
    __setAgentSupabaseFactoryForTests(async () => supabaseStub as never);
    __setRateLimitClientFactoryForTests(async () => supabaseStub as never);

    let call = 0;
    __setAgentOpenAIFetchForTests(async (input) => {
      const url = typeof input === "string" ? input : input.toString();
      if (!url.includes("tool_outputs")) {
        call += 1;
        return createSseResponse([
          JSON.stringify({ type: "response.created", response: { id: "resp_1" } }),
          JSON.stringify({
            type: "response.required_action",
            response: { id: "resp_1" },
            required_action: {
              type: "submit_tool_outputs",
              submit_tool_outputs: {
                tool_calls: [
                  {
                    id: "call_1",
                    type: "function",
                    function: {
                      name: "reference.generate",
                      arguments: JSON.stringify({ org_id: "org-123", purpose: "wallet_topup" }),
                    },
                  },
                ],
              },
            },
          }),
        ]);
      }

      return createSseResponse([
        JSON.stringify({ type: "response.output_text.delta", delta: { text: "Muraho " } }),
        JSON.stringify({
          type: "response.output_text.delta",
          delta: { text: "Here is your profile summary." },
        }),
        JSON.stringify({
          type: "response.output_text.done",
          response: {
            output: [
              {
                content: [{ type: "output_text", text: "Here is your profile summary." }],
              },
            ],
          },
        }),
        JSON.stringify({ type: "response.completed", response: { status: "completed" } }),
      ]);
    });

    const server = createAgentTestServer();

    const response = await request(server)
      .post("/api/agent/chat")
      .set("content-type", "application/json")
      .send({
        messages: [{ role: "user", content: "Muraho neza" }],
      })
      .buffer(true)
      .parse((res: SupertestResponse, callback: (err: Error | null, body: string) => void) => {
        res.setEncoding("utf8");
        let data = "";
        res.on("data", (chunk: string) => {
          data += chunk;
        });
        res.on("end", () => callback(null, data));
      });

    assert.equal(response.status, 200);
    const body = response.body as string;
    assert.ok(body.includes("event: metadata"));
    assert.ok(body.includes("event: token"));
    assert.ok(body.includes("event: tool_result"));
    assert.ok(body.includes("Ikimina Coop"));
    assert.ok(body.includes("Here is your profile summary"));
    assert.ok(call >= 1);
  });
});
