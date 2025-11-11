#!/usr/bin/env node
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { logError, logInfo, logWarn } from "./utils/logger.mjs";

const BUILD_MANIFEST_PATH = path.join(process.cwd(), ".next", "build-manifest.json");
const APP_MANIFEST_PATH = path.join(process.cwd(), ".next", "app-build-manifest.json");

function formatBytes(bytes) {
  const units = ["B", "KB", "MB"];
  let size = bytes;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  const precision = size < 10 && index > 0 ? 1 : 0;
  return `${size.toFixed(precision)}${units[index]}`;
}

async function fileSize(relativePath) {
  const filePath = path.join(process.cwd(), ".next", relativePath);
  const info = await stat(filePath);
  return info.size;
}

async function sumAssetSizes(assetPaths) {
  const unique = Array.from(new Set(assetPaths));
  let total = 0;
  for (const asset of unique) {
    total += await fileSize(asset);
  }
  return total;
}

async function main() {
  let buildManifest;
  let appManifest;
  try {
    buildManifest = JSON.parse(await readFile(BUILD_MANIFEST_PATH, "utf8"));
  } catch (error) {
    logError("admin.bundle-budgets.read-failed", {
      manifest: "build",
      path: BUILD_MANIFEST_PATH,
      error,
    });
    throw error;
  }

  try {
    appManifest = JSON.parse(await readFile(APP_MANIFEST_PATH, "utf8"));
  } catch (error) {
    logError("admin.bundle-budgets.read-failed", {
      manifest: "app",
      path: APP_MANIFEST_PATH,
      error,
    });
    throw error;
  }

  const initialAssets = [
    ...(buildManifest.rootMainFiles ?? []),
    ...(buildManifest.polyfillFiles ?? []),
  ];
  const initialTotal = await sumAssetSizes(initialAssets);

  const sharedAssets = new Set(initialAssets);
  const dashboardAssets = appManifest.pages?.["/(main)/dashboard/page"] ?? [];
  const dashboardSpecificAssets = dashboardAssets.filter((asset) => !sharedAssets.has(asset));
  const dashboardTotal =
    dashboardSpecificAssets.length > 0 ? await sumAssetSizes(dashboardSpecificAssets) : null;

  const checks = [
    {
      label: "Initial JS total",
      value: initialTotal,
      limit: 480 * 1024,
    },
  ];

  if (dashboardTotal != null) {
    checks.push({
      label: "Dashboard payload",
      value: dashboardTotal,
      limit: 360 * 1024,
    });
  } else {
    logWarn("admin.bundle-budgets.dashboard-missing", {
      message: "Dashboard route missing from app manifest; skipping dashboard budget.",
    });
  }

  const failures = [];
  for (const check of checks) {
    if (check.value > check.limit) {
      failures.push({
        label: check.label,
        actual: check.value,
        limit: check.limit,
      });
    } else {
      logInfo("admin.bundle-budgets.check", {
        label: check.label,
        value: check.value,
        formattedValue: formatBytes(check.value),
        limit: check.limit,
        formattedLimit: formatBytes(check.limit),
      });
    }
  }

  if (failures.length > 0) {
    logError("admin.bundle-budgets.failed", {
      failures: failures.map((failure) => ({
        label: failure.label,
        actual: failure.actual,
        formattedActual: formatBytes(failure.actual),
        limit: failure.limit,
        formattedLimit: formatBytes(failure.limit),
      })),
    });
    process.exit(1);
  }

  logInfo("admin.bundle-budgets.ok");
}

main().catch((error) => {
  logError("admin.bundle-budgets.unhandled", { error });
  process.exit(1);
});
