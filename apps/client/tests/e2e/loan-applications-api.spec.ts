import { test, expect } from "@playwright/test";
import { AddressInfo } from "node:net";
import { createNextRouteServer } from "../integration/utils/next-route-server";
import {
  POST as loanApplicationsPost,
  __setLoanApplicationsSupabaseFactoryForTests,
} from "@/app/api/loans/applications/route";

interface LoanSupabaseStubOptions {
  mode: "normal" | "slow" | "offline";
  delayMs?: number;
}

const createLoanSupabaseStub = (options: LoanSupabaseStubOptions) => {
  const inserts: Array<Record<string, unknown>> = [];

  const client = {
    auth: {
      async getUser() {
        return {
          data: { user: { id: "user-loan-123", email: "loaner@example.com" } },
          error: null,
        } as const;
      },
    },
    from(table: string) {
      if (table !== "loan_applications") {
        throw new Error(`Unexpected table ${table}`);
      }

      return {
        insert(values: Record<string, unknown>) {
          inserts.push(values);

          const run = async () => {
            if (options.mode === "offline") {
              const offlineError = new TypeError("fetch failed");
              (offlineError as Error & { code?: string }).code = "ECONNREFUSED";
              throw offlineError;
            }

            if (options.mode === "slow" && typeof options.delayMs === "number") {
              await new Promise((resolve) => setTimeout(resolve, options.delayMs));
            }

            return {
              data: {
                id: "loan-app-xyz",
                status: "DRAFT",
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

test.describe("loan applications API network resilience", () => {
  let server: ReturnType<typeof createNextRouteServer>;
  let baseURL: string;

  test.beforeAll(async () => {
    server = createNextRouteServer({
      path: "/api/loans/applications",
      method: "POST",
      handler: loanApplicationsPost,
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as AddressInfo;
    baseURL = `http://127.0.0.1:${address.port}`;
  });

  test.afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  test.afterEach(() => {
    __setLoanApplicationsSupabaseFactoryForTests(null);
  });

  test("gracefully succeeds after slow Supabase response", async ({ request }) => {
    const stub = createLoanSupabaseStub({ mode: "slow", delayMs: 750 });
    __setLoanApplicationsSupabaseFactoryForTests(async () => stub.client);

    const payload = {
      org_id: "org-123",
      product_id: "prod-789",
      requested_amount: 500_000,
      tenor_months: 6,
      purpose: "Working capital",
      applicant_name: "Aline U.",
      applicant_phone: "+250788000111",
      applicant_email: "aline@example.com",
      applicant_nid: "1199999999999999",
    };

    const response = await request.post(`${baseURL}/api/loans/applications`, { data: payload });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.application).toBeDefined();
    expect(body.application.status).toBe("DRAFT");
    expect(body.application.requested_amount).toBe(payload.requested_amount);
    expect(stub.inserts).toHaveLength(1);
    expect(stub.inserts[0].tenor_months).toBe(payload.tenor_months);
  });

  test("returns 503 when Supabase is unreachable", async ({ request }) => {
    const stub = createLoanSupabaseStub({ mode: "offline" });
    __setLoanApplicationsSupabaseFactoryForTests(async () => stub.client);

    const response = await request.post(`${baseURL}/api/loans/applications`, {
      data: {
        org_id: "org-321",
        product_id: "prod-222",
        requested_amount: 100_000,
        tenor_months: 3,
        purpose: "Inventory",
        applicant_name: "Jean",
        applicant_phone: "+250788000222",
        applicant_email: "jean@example.com",
        applicant_nid: "1188888888888888",
      },
    });

    expect(response.status()).toBe(503);
    const body = await response.json();
    expect(body.error).toBe("Supabase unavailable");
    expect(stub.inserts).toHaveLength(1);
  });
});
