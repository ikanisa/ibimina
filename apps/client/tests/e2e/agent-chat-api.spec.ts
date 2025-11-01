import { test, expect } from "@playwright/test";
import { AddressInfo } from "node:net";
import { createAgentTestServer } from "../integration/utils/test-server";
import {
  __setAgentOpenAIFetchForTests,
  __setAgentSupabaseFactoryForTests,
} from "@/app/api/agent/chat/route";
import { __setRateLimitClientFactoryForTests } from "@/lib/rate-limit";

const createSupabaseStub = () => ({
  auth: {
    async getUser() {
      return {
        data: { user: { id: "user-456", email: "playwright@example.com" } },
        error: null,
      };
    },
  },
  async rpc() {
    return { data: true, error: null };
  },
  from(table: string) {
    if (table === "members_app_profiles") {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        async maybeSingle() {
          return {
            data: {
              lang: "en",
              whatsapp_msisdn: "+250788000999",
              momo_msisdn: "+250788111222",
            },
            error: null,
          };
        },
      } as const;
    }

    if (table === "user_saccos") {
      return {
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
          return {
            data: {
              sacco_id: "sacco-xyz",
              saccos: { name: "Nyamata SACCO", metadata: { country: "RW" } },
            },
            error: null,
          };
        },
      } as const;
    }

    if (table === "ibimina") {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        order() {
          return this;
        },
        async limit() {
          return { data: [], error: null };
        },
      } as const;
    }

    throw new Error(`Unexpected table ${table}`);
  },
});

test.describe("agent chat API error handling", () => {
  let server: ReturnType<typeof createAgentTestServer>;
  let baseURL: string;

  test.beforeAll(async () => {
    server = createAgentTestServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as AddressInfo;
    baseURL = `http://127.0.0.1:${address.port}`;
  });

  test.afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  test.beforeEach(() => {
    process.env.OPENAI_API_KEY = "playwright-key";
    process.env.RATE_LIMIT_SECRET = "playwright-rate-limit";
    const supabaseStub = createSupabaseStub();
    __setAgentSupabaseFactoryForTests(async () => supabaseStub as never);
    __setRateLimitClientFactoryForTests(async () => supabaseStub as never);
    __setAgentOpenAIFetchForTests(async () => new Response("failure", { status: 500 }));
  });

  test.afterEach(() => {
    __setAgentSupabaseFactoryForTests(null);
    __setRateLimitClientFactoryForTests(null);
    __setAgentOpenAIFetchForTests(null);
  });

  test("emits error event when OpenAI returns failure", async ({ request }) => {
    const response = await request.post(`${baseURL}/api/agent/chat`, {
      data: {
        messages: [{ role: "user", content: "Test connection" }],
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("event: error");
    expect(body).toContain("OpenAI error");
    expect(body).toContain("event: done");
  });
});
