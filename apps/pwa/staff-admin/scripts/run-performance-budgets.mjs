import { mkdir, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import process from "node:process";
import { setTimeout as sleep } from "node:timers/promises";

import { logError, logInfo } from "./utils/logger.mjs";

const REPORT_PATH = new URL("../.lighthouse/report.json", import.meta.url);
const BUDGET_PATH = new URL("../lighthouse.budgets.json", import.meta.url);

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: false, ...options });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
      }
    });
  });
}

async function waitForServer(url, retries = 30, delayMs = 1000) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) {
        return;
      }
    } catch {}
    await sleep(delayMs);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function extractResourceSize(items, type) {
  const match = items.find(
    (item) => item.resourceType === type || item.resourceType === type.toUpperCase()
  );
  if (!match) return 0;
  if (typeof match.transferSize === "number") {
    return match.transferSize / 1024;
  }
  if (typeof match.size === "number") {
    return match.size;
  }
  return 0;
}

async function main() {
  const cwd = new URL("../", import.meta.url);

  await run("pnpm", ["run", "build"], { cwd: cwd.pathname });

  const server = spawn("pnpm", ["run", "start"], {
    cwd: cwd.pathname,
    stdio: "inherit",
    env: { ...process.env, PORT: "3100" },
  });

  try {
    await waitForServer("http://127.0.0.1:3100/dashboard");
    await mkdir(new URL("../.lighthouse", import.meta.url), { recursive: true });
    await run(
      "npx",
      [
        "--yes",
        "lighthouse",
        "http://127.0.0.1:3100/dashboard",
        "--config-path=./lighthouse.config.cjs",
        "--budgets-path=./lighthouse.budgets.json",
        "--output=json",
        `--output-path=${REPORT_PATH.pathname}`,
        "--quiet",
      ],
      { cwd: cwd.pathname }
    );
  } finally {
    server.kill("SIGINT");
    await sleep(1000);
  }

  const reportRaw = await readFile(REPORT_PATH);
  const report = JSON.parse(reportRaw.toString());
  const budgets = JSON.parse((await readFile(BUDGET_PATH)).toString());

  const errors = [];
  const resourceItems = report?.audits?.["resource-summary"]?.details?.items ?? [];
  const totalBytes = report?.audits?.["total-byte-weight"]?.numericValue ?? 0;
  const interactive = report?.audits?.interactive?.numericValue ?? 0;
  const fcp = report?.audits?.["first-contentful-paint"]?.numericValue ?? 0;
  const thirdPartyItems = report?.audits?.["third-party-summary"]?.details?.items ?? [];
  const thirdPartyCount = Array.isArray(thirdPartyItems)
    ? thirdPartyItems.reduce((sum, item) => sum + (item.requestCount ?? 0), 0)
    : 0;

  const budget = budgets[0] ?? {};
  const resourceBudgets = budget.resourceSizes ?? [];
  for (const entry of resourceBudgets) {
    const actual =
      entry.resourceType === "total"
        ? totalBytes / 1024
        : extractResourceSize(resourceItems, entry.resourceType);
    if (actual > entry.budget) {
      errors.push({
        type: "resource-size",
        resourceType: entry.resourceType,
        actualKb: Number(actual.toFixed(1)),
        budgetKb: entry.budget,
      });
    }
  }

  const resourceCountBudgets = budget.resourceCounts ?? [];
  for (const entry of resourceCountBudgets) {
    if (entry.resourceType === "third-party" && thirdPartyCount > entry.budget) {
      errors.push({
        type: "resource-count",
        resourceType: "third-party",
        count: thirdPartyCount,
        budget: entry.budget,
      });
    }
  }

  const timingBudgets = budget.timings ?? [];
  for (const entry of timingBudgets) {
    if (entry.metric === "interactive" && interactive > entry.budget) {
      errors.push({
        type: "timing",
        metric: entry.metric,
        actualMs: Math.round(interactive),
        budgetMs: entry.budget,
      });
    }
    if (entry.metric === "first-contentful-paint" && fcp > entry.budget) {
      errors.push({
        type: "timing",
        metric: entry.metric,
        actualMs: Math.round(fcp),
        budgetMs: entry.budget,
      });
    }
  }

  if (errors.length > 0) {
    logError("admin.performance-budgets.failed", { errors });
    process.exit(1);
  }

  logInfo("admin.performance-budgets.passed", {
    totals: {
      totalBytes,
      interactive,
      firstContentfulPaint: fcp,
      thirdPartyCount,
    },
  });
}

main().catch((error) => {
  logError("admin.performance-budgets.unhandled", { error });
  process.exit(1);
});
