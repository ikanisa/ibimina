#!/usr/bin/env node
import { runGsmHeartbeat } from "./workers/gsm-heartbeat";
import { runMomoPoller } from "./workers/momo-poller";

const command = process.argv[2] ?? "all";

async function main() {
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
      console.error(`Unknown command: ${command}`);
      process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Worker execution failed", error);
  process.exitCode = 1;
});
