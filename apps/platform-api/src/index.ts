#!/usr/bin/env node
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
  captureException(error, { command });
  logError("platform_api.unhandled_error", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
