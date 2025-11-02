#!/usr/bin/env node
import { normalizeError } from "@ibimina/lib";

import { runGsmHeartbeat } from "./workers/gsm-heartbeat";
import { runMomoPoller } from "./workers/momo-poller";
import { ensureObservability, logError, captureException } from "./lib/observability/index.js";

const command = process.argv[2] ?? "all";

async function main() {
  ensureObservability();
  switch (command) {
    case "momo":
      await runMomoPoller();
      break;
    case "gsm":
      await runGsmHeartbeat();
      break;
    case "all":
      await runMomoPoller();
      await runGsmHeartbeat();
      break;
    default:
      logError("platform_api.unknown_command", { command });
      process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      level: "error",
      event: "platform-api.worker.failure",
      error: normalizeError(error),
      timestamp: new Date().toISOString(),
    })
  );
  process.exitCode = 1;
});
