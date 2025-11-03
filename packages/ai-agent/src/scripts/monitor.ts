#!/usr/bin/env node
import { buildIngestionMetrics, SupabaseVectorStore } from "../index.js";

interface MonitorArgs {
  limit?: number;
  failures?: number;
}

function parseArgs(): MonitorArgs {
  const args: MonitorArgs = {};
  for (const raw of process.argv.slice(2)) {
    const [key, value] = raw.split("=");
    if (!key.startsWith("--")) {
      continue;
    }

    const normalized = key.slice(2);
    switch (normalized) {
      case "limit":
        args.limit = value ? Number.parseInt(value, 10) : undefined;
        break;
      case "failures":
      case "recentFailures":
        args.failures = value ? Number.parseInt(value, 10) : undefined;
        break;
      default:
        break;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs();
  const store = SupabaseVectorStore.fromEnv();
  const metrics = await buildIngestionMetrics(store, {
    limit: args.limit,
    includeFailures: args.failures,
  });

  console.log(JSON.stringify(metrics, null, 2));
}

main().catch((error) => {
  console.error("Failed to compute ingestion metrics", error);
  process.exit(1);
});
