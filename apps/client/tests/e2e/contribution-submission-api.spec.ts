import { test, expect } from "@playwright/test";
import { AddressInfo } from "node:net";
import { createNextRouteServer } from "../integration/utils/next-route-server";
import {
  POST as ticketsPost,
  __setAgentTicketsSupabaseFactoryForTests,
} from "@/app/api/agent/tickets/route";

interface TicketSupabaseStubOptions {
  mode: "normal" | "slow" | "offline";
  delayMs?: number;
}

const createTicketSupabaseStub = (options: TicketSupabaseStubOptions) => {
  const inserts: Array<Record<string, unknown>> = [];

  const client = {
    auth: {
      async getUser() {
        return {
          data: { user: { id: "user-ticket-789", email: "supporter@example.com" } },
          error: null,
        } as const;
      },
    },
    from(table: string) {
      if (table !== "tickets") {
        throw new Error(`Unexpected table ${table}`);
      }

      return {
        insert(values: Record<string, unknown>) {
          inserts.push(values);

          const run = async () => {
            if (options.mode === "offline") {
              const offlineError = new TypeError("fetch failed");
              (offlineError as Error & { code?: string }).code = "ENOTFOUND";
              throw offlineError;
            }

            if (options.mode === "slow" && typeof options.delayMs === "number") {
              await new Promise((resolve) => setTimeout(resolve, options.delayMs));
            }

            return {
              data: {
                id: "ticket-123",
                status: values.status ?? "open",
                created_at: new Date().toISOString(),
                ...values,
              },
              error: null,
            } as const;
          };

          return {
            select() {
              return {
                single: run,
              } as const;
            },
            single: run,
          } as const;
        },
      } as const;
    },
  } as const;

  return { client, inserts };
};

test.describe("contribution submission resilience", () => {
  let server: ReturnType<typeof createNextRouteServer>;
  let baseURL: string;

  test.beforeAll(async () => {
    server = createNextRouteServer({
      path: "/api/agent/tickets",
      method: "POST",
      handler: ticketsPost,
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as AddressInfo;
    baseURL = `http://127.0.0.1:${address.port}`;
  });

  test.afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  test.afterEach(() => {
    __setAgentTicketsSupabaseFactoryForTests(null);
  });

  test("records contribution ticket despite slow persistence", async ({ request }) => {
    const stub = createTicketSupabaseStub({ mode: "slow", delayMs: 600 });
    __setAgentTicketsSupabaseFactoryForTests(async () => stub.client);

    const payload = {
      org_id: "org-contrib",
      channel: "member-app",
      subject: "Contribution submission",
      priority: "high",
      meta: { amount: 20000, reference: "KGL-2024-0001" },
    };

    const response = await request.post(`${baseURL}/api/agent/tickets`, { data: payload });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.ticket).toBeDefined();
    expect(body.ticket.subject).toBe(payload.subject);
    expect(stub.inserts).toHaveLength(1);
    expect(stub.inserts[0].meta).toEqual(payload.meta);
  });

  test("returns 503 when Supabase ticket insert fails offline", async ({ request }) => {
    const stub = createTicketSupabaseStub({ mode: "offline" });
    __setAgentTicketsSupabaseFactoryForTests(async () => stub.client);

    const response = await request.post(`${baseURL}/api/agent/tickets`, {
      data: {
        org_id: "org-contrib",
        channel: "member-app",
        subject: "Contribution submission",
        priority: "medium",
        meta: { amount: 15000, reference: "KGL-2024-0002" },
      },
    });

    expect(response.status()).toBe(503);
    const body = await response.json();
    expect(body.error).toBe("Supabase unavailable");
    expect(stub.inserts).toHaveLength(1);
  });
});
