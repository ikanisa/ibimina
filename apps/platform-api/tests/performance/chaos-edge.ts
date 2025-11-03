import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { requireEnv } from "../../src/lib/edgeClient";

interface ChaosScenario {
  name: string;
  path: string;
  method?: string;
  payload?: Record<string, unknown>;
  mutateRequest?: (request: ChaosRequest) => ChaosRequest;
  expectSuccess: boolean;
}

interface ChaosRequest {
  url: URL;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timeoutMs: number;
}

const encoder = new TextEncoder();

const defaultHeaders = (timestamp: string, signature: string) => ({
  "content-type": "application/json",
  "x-timestamp": timestamp,
  "x-signature": signature,
});

const buildSignature = async (
  secret: string,
  timestamp: string,
  method: string,
  pathname: string,
  body: string
) => {
  const { createHmac } = await import("node:crypto");
  const hmac = createHmac("sha256", secret);
  hmac.update(encoder.encode(timestamp));
  hmac.update(encoder.encode(`${method.toUpperCase()}:${pathname}`));
  hmac.update(encoder.encode(body));
  return hmac.digest("hex");
};

const baseUrl = () => {
  const candidate =
    process.env.EDGE_FUNCTION_BASE_URL ?? `${requireEnv("SUPABASE_URL")}/functions/v1/`;
  return candidate.endsWith("/") ? candidate : `${candidate}/`;
};

const buildRequest = async (scenario: ChaosScenario): Promise<ChaosRequest> => {
  const url = new URL(scenario.path, baseUrl());
  const method = scenario.method ?? (scenario.payload ? "POST" : "GET");
  const body = scenario.payload ? JSON.stringify(scenario.payload) : "";
  const timestamp = new Date().toISOString();
  const signature = await buildSignature(
    requireEnv("HMAC_SHARED_SECRET"),
    timestamp,
    method,
    url.pathname,
    body
  );
  const headers = defaultHeaders(timestamp, signature);

  return {
    url,
    method,
    body: body || undefined,
    headers,
    timeoutMs: Number.parseInt(process.env.CHAOS_TIMEOUT_MS ?? "15000", 10),
  };
};

async function executeRequest(request: ChaosRequest, scenarioName: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), request.timeoutMs);
  const start = performance.now();

  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      signal: controller.signal,
    });

    const latency = performance.now() - start;
    const text = await response.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }

    return { response, latency, payload: json };
  } catch (error) {
    const latency = performance.now() - start;
    console.error("chaos.network_error", {
      scenario: scenarioName,
      message: error instanceof Error ? error.message : String(error),
      latency,
    });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

const scenarios = (): ChaosScenario[] => {
  const saccoId = process.env.LOAD_SACCO_ID ?? "perf-test";
  return [
    {
      name: "tampered-signature",
      path: "ingest-sms",
      payload: {
        rawText: "DEPOSIT 2500 RWF TO PERF REF CHAOS",
        receivedAt: new Date().toISOString(),
        saccoId,
      },
      expectSuccess: false,
      mutateRequest: (request) => ({
        ...request,
        headers: {
          ...request.headers,
          "x-signature": "invalid",
        },
      }),
    },
    {
      name: "stale-timestamp",
      path: "ingest-sms",
      payload: {
        rawText: "DEPOSIT 9000 RWF TO PERF REF STALE",
        receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        saccoId,
      },
      expectSuccess: false,
      mutateRequest: (request) => ({
        ...request,
        headers: {
          ...request.headers,
          "x-timestamp": new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        },
      }),
    },
    {
      name: "oversized-payload",
      path: "ingest-sms",
      payload: {
        rawText: `DEPOSIT ${"1".repeat(4096)}`,
        receivedAt: new Date().toISOString(),
        saccoId,
        vendorMeta: { fuzz: randomUUID() },
      },
      expectSuccess: false,
    },
    {
      name: "rapid-heartbeat",
      path: "gsm-heartbeat",
      method: "POST",
      payload: { schedule: "chaos" },
      expectSuccess: true,
    },
    {
      name: "poller-surge",
      path: "momo-statement-poller",
      method: "POST",
      payload: { dryRun: true },
      expectSuccess: true,
    },
  ];
};

async function runScenario(scenario: ChaosScenario) {
  const baseRequest = await buildRequest(scenario);
  const request = scenario.mutateRequest ? scenario.mutateRequest(baseRequest) : baseRequest;
  try {
    const result = await executeRequest(request, scenario.name);
    const { response, latency, payload } = result;
    const ok = response.ok;

    if (scenario.expectSuccess && !ok) {
      console.error("chaos.expectation_failed", {
        scenario: scenario.name,
        status: response.status,
        payload,
        latency,
      });
      return { name: scenario.name, ok: false, status: response.status, latency };
    }

    if (!scenario.expectSuccess && ok) {
      console.error("chaos.expected_failure_missing", {
        scenario: scenario.name,
        status: response.status,
        payload,
        latency,
      });
      return { name: scenario.name, ok: false, status: response.status, latency };
    }

    console.info("chaos.scenario_complete", {
      scenario: scenario.name,
      status: response.status,
      latency,
      ok,
    });
    return { name: scenario.name, ok: true, status: response.status, latency };
  } catch (error) {
    console.error("chaos.scenario_error", {
      scenario: scenario.name,
      message: error instanceof Error ? error.message : String(error),
    });
    return { name: scenario.name, ok: false, status: 0, latency: 0 };
  }
}

async function main() {
  requireEnv("SUPABASE_URL");
  requireEnv("HMAC_SHARED_SECRET");

  const results = await Promise.all(scenarios().map((scenario) => runScenario(scenario)));
  const failures = results.filter((result) => !result.ok);

  if (failures.length) {
    console.error("chaos.failures", { failures });
    process.exitCode = 1;
  } else {
    console.info("chaos.all_passed", { count: results.length });
  }
}

main().catch((error) => {
  console.error("chaos.unhandled", {
    message: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
