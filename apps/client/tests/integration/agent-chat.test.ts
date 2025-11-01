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
    whatsapp_msisdn: "+250788123456",
    momo_msisdn: "+250788654321",
  };

  const sacco = {
    sacco_id: "sacco-123",
    saccos: {
      name: "Ikimina Coop",
      metadata: { country: "RW" },
    },
  };

  const groups = [
    { id: "group-1", name: "Twiteze Imbere", status: "ACTIVE" },
    { id: "group-2", name: "Abishyizehamwe", status: "INACTIVE" },
  ];

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

  const builderForSacco = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    order() {
      return this;
    },
    limit() {
      return this;
    },
    async maybeSingle() {
      return { data: sacco, error: null };
    },
    async single() {
      return { data: sacco, error: null };
    },
  } as const;

  const builderForGroups = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    order() {
      return this;
    },
    async limit(count: number) {
      return { data: groups.slice(0, count), error: null };
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
    async rpc() {
      return { data: true, error: null };
    },
    from(table: string) {
      if (table === "members_app_profiles") {
        return builderForProfile;
      }
      if (table === "user_saccos") {
        return builderForSacco;
      }
      if (table === "ibimina") {
        return builderForGroups;
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
          JSON.stringify({ type: "response.output_text.delta", delta: { text: "Muraho " } }),
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
                      name: "fetch_member_profile",
                      arguments: JSON.stringify({ include_contacts: true }),
                    },
                  },
                ],
              },
            },
          }),
        ]);
      }

      return createSseResponse([
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
    assert.ok(body.includes("+250788123456"));
    assert.ok(body.includes("Here is your profile summary"));
    assert.ok(call >= 1);
  });
});
