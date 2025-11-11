#!/usr/bin/env node
import { readFile } from "node:fs/promises";

import { logError, logInfo } from "./utils/logger.mjs";

const REPORT_PATH = ".reports/lighthouse.json";
const THRESHOLDS = {
  performance: 0.9,
  accessibility: 0.9,
  pwa: 0.9,
};

function formatScore(score) {
  if (typeof score !== "number" || Number.isNaN(score)) return "N/A";
  return `${Math.round(score * 100)}%`;
}

async function main() {
  let raw;
  try {
    raw = await readFile(REPORT_PATH, "utf8");
  } catch (error) {
    logError("admin.lighthouse.read-failed", { path: REPORT_PATH, error });
    throw error;
  }

  const report = JSON.parse(raw);
  const categories = report?.categories ?? {};

  const failures = [];
  for (const [category, minimum] of Object.entries(THRESHOLDS)) {
    const score = categories?.[category]?.score;
    if (typeof score !== "number") {
      failures.push(`Category \"${category}\" missing from Lighthouse report.`);
      continue;
    }

    if (score < minimum) {
      failures.push({
        category,
        score,
        minimum,
      });
    } else {
      logInfo("admin.lighthouse.threshold", {
        category,
        score,
        formattedScore: formatScore(score),
        minimum,
        formattedMinimum: Math.round(minimum * 100),
      });
    }
  }

  if (failures.length > 0) {
    logError("admin.lighthouse.failed", {
      failures: failures.map((failure) => ({
        category: failure.category,
        score: failure.score,
        formattedScore: formatScore(failure.score),
        minimum: failure.minimum,
        formattedMinimum: Math.round(failure.minimum * 100),
      })),
    });
    process.exit(1);
  }

  logInfo("admin.lighthouse.ok");
}

main().catch((error) => {
  logError("admin.lighthouse.unhandled", { error });
  process.exit(1);
});
