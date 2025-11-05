import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { invokeEdge, requireEnv } from "../../src/lib/edgeClient";

interface LoadConfig {
  durationMs: number;
  concurrency: number;
  ingestionFunction: string;
  edgeTargets: string[];
  timeoutMs: number;
}

interface LoadMetrics {
  totalRequests: number;
  successes: number;
  failures: number;
  latencies: number[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const defaultConfig = (): LoadConfig => ({
  durationMs: Number.parseInt(process.env.LOAD_DURATION_MS ?? "90000", 10),
  concurrency: Number.parseInt(process.env.LOAD_CONCURRENCY ?? "12", 10),
  ingestionFunction: process.env.INGESTION_FUNCTION ?? "ingest-sms",
  edgeTargets: (process.env.EDGE_TARGETS ?? "momo-statement-poller,gsm-heartbeat")
    .split(",")
    .map((target) => target.trim())
    .filter(Boolean),
  timeoutMs: Number.parseInt(process.env.LOAD_TIMEOUT_MS ?? "20000", 10),
});

const buildIngestionPayload = (iteration: number) => {
  const saccoId = process.env.LOAD_SACCO_ID ?? "perf-test";
  const txnId = randomUUID();
  const amount = Math.floor(1000 + Math.random() * 90000);
  const timestamp = new Date().toISOString();
  return {
    rawText: `DEPOSIT ${amount} RWF TO ${saccoId.toUpperCase()} REF ${txnId}`,
    receivedAt: timestamp,
    vendorMeta: {
      source: "load-test",
      iteration,
      saccoId,
    },
    saccoId,
  };
};

async function fireIngestion(config: LoadConfig, iteration: number) {
  const start = performance.now();
  try {
    await invokeEdge(config.ingestionFunction, {
      method: "POST",
      body: buildIngestionPayload(iteration),
      timeoutMs: config.timeoutMs,
    });
    const latency = performance.now() - start;
    return { ok: true, latency };
  } catch (error) {
    const latency = performance.now() - start;
    console.error("load.ingestion_failed", {
      iteration,
      latency,
      message: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, latency };
  }
}

async function pingEdgeTarget(config: LoadConfig, target: string) {
  try {
    await invokeEdge(target, { method: "POST", timeoutMs: config.timeoutMs });
  } catch (error) {
    console.warn("load.edge_target_failed", {
      target,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function runWorker(
  config: LoadConfig,
  metrics: LoadMetrics,
  workerId: number,
  endTime: number
) {
  let iteration = 0;
  while (performance.now() < endTime) {
    iteration += 1;
    metrics.totalRequests += 1;
    const result = await fireIngestion(config, iteration);
    metrics.latencies.push(result.latency);
    if (result.ok) {
      metrics.successes += 1;
    } else {
      metrics.failures += 1;
      // Back off slightly on failure to give the ingestion queue time to catch up
      await sleep(250);
    }

    if (config.edgeTargets.length && iteration % 5 === 0) {
      const target = config.edgeTargets[(workerId + iteration) % config.edgeTargets.length];
      pingEdgeTarget(config, target).catch((error) => {
        console.warn("load.edge_ping_unhandled", {
          target,
          message: error instanceof Error ? error.message : String(error),
        });
      });
    }
  }
}

const summarize = (metrics: LoadMetrics) => {
  const sortedLatencies = metrics.latencies.slice().sort((a, b) => a - b);
  const percentile = (p: number) => {
    if (!sortedLatencies.length) return 0;
    const index = Math.min(
      sortedLatencies.length - 1,
      Math.floor((p / 100) * sortedLatencies.length)
    );
    return Number(sortedLatencies[index].toFixed(2));
  };

  const average =
    sortedLatencies.reduce((total, latency) => total + latency, 0) /
    Math.max(sortedLatencies.length, 1);

  return {
    total: metrics.totalRequests,
    successes: metrics.successes,
    failures: metrics.failures,
    successRate: metrics.totalRequests
      ? Number(((metrics.successes / metrics.totalRequests) * 100).toFixed(2))
      : 0,
    averageLatencyMs: Number(average.toFixed(2)),
    p50LatencyMs: percentile(50),
    p90LatencyMs: percentile(90),
    p99LatencyMs: percentile(99),
  };
};

async function main() {
  requireEnv("SUPABASE_URL");
  requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  requireEnv("HMAC_SHARED_SECRET");

  const config = defaultConfig();
  const metrics: LoadMetrics = {
    totalRequests: 0,
    successes: 0,
    failures: 0,
    latencies: [],
  };

  console.info("load.start", config);
  const endTime = performance.now() + config.durationMs;
  const workers: Promise<void>[] = [];
  for (let i = 0; i < config.concurrency; i += 1) {
    workers.push(runWorker(config, metrics, i, endTime));
  }

  await Promise.all(workers);
  const summary = summarize(metrics);
  console.info("load.summary", summary);

  if (summary.successRate < Number(process.env.LOAD_MIN_SUCCESS_RATE ?? "97")) {
    console.error("load.threshold_failed", {
      successRate: summary.successRate,
      required: process.env.LOAD_MIN_SUCCESS_RATE ?? "97",
    });
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("load.unhandled", {
    message: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
