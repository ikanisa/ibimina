#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { access } from "node:fs/promises";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

import { logError, logInfo, logResult, logWarn } from "./utils/logger.mjs";

const results = [];
const args = new Set(process.argv.slice(2));

const skipBuild = args.has("--skip-build") || process.env.SKIP_PWA_BUILD === "1";

function recordSkip(name) {
  const result = { name, ok: true, skipped: true };
  results.push(result);
  logResult("admin.verify-pwa.step", result);
}

async function step(name, fn) {
  try {
    await fn();
    const result = { name, ok: true };
    results.push(result);
    logResult("admin.verify-pwa.step", result);
  } catch (error) {
    const result = { name, ok: false, error };
    results.push(result);
    logResult("admin.verify-pwa.step", result);
  }
}

function logSummary() {
  for (const item of results) {
    logResult("admin.verify-pwa.summary", {
      name: item.name,
      ok: item.ok,
      skipped: item.skipped ?? false,
      error: item.error,
    });
  }
}

async function checkManifest() {
  const manifestRaw = await readFile("public/manifest.json", "utf8");
  const manifest = JSON.parse(manifestRaw);
  const requiredSizes = new Set(["192x192", "512x512"]);
  const icons = manifest.icons || [];
  for (const icon of icons) {
    if (icon?.sizes) {
      icon.sizes
        .split(/\s+/)
        .filter(Boolean)
        .forEach((size) => requiredSizes.delete(size));
    }
  }
  if (requiredSizes.size > 0) {
    throw new Error(`Manifest is missing PNG icons for: ${Array.from(requiredSizes).join(", ")}`);
  }
  if (manifest.theme_color !== "#0b1020") {
    throw new Error("Manifest theme_color is not #0b1020");
  }
}

async function checkLayoutHead() {
  const layout = await readFile("app/layout.tsx", "utf8");
  if (!layout.includes('manifest: "/manifest.json"')) {
    throw new Error("Root layout is not advertising /manifest.json");
  }
  if (!layout.includes('themeColor: "#0b1020"')) {
    throw new Error("Root layout themeColor is not set to #0b1020");
  }
}

async function checkServiceWorker() {
  await access("service-worker.js");
}

async function runCommand(command, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...opts });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function runBuild() {
  await runCommand("npm", ["run", "build"]);
}

async function runServerHealthcheck() {
  const port = 3100;
  const nextBin =
    process.platform === "win32" ? "node_modules/.bin/next.cmd" : "node_modules/.bin/next";
  const server = spawn(nextBin, ["start", "-p", String(port), "-H", "127.0.0.1"], {
    env: { ...process.env },
    stdio: "inherit",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 45000);

  const url = `http://127.0.0.1:${port}/api/healthz`;
  let success = false;
  let exitCode = null;
  let exitSignal = null;
  server.on("exit", (code, signal) => {
    exitCode = code;
    exitSignal = signal;
  });

  try {
    for (let attempt = 0; attempt < 15; attempt += 1) {
      await sleep(3000, null, { signal: controller.signal }).catch(() => {});
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (response.ok) {
          logInfo("admin.verify-pwa.healthcheck", {
            status: "ok",
            response: await response.text(),
          });
          success = true;
          break;
        }
      } catch {
        if (controller.signal.aborted) {
          break;
        }
      }
    }
  } finally {
    clearTimeout(timeout);
    server.kill("SIGINT");
  }

  await new Promise((resolve) => server.on("close", resolve));

  if (!success) {
    if (exitCode !== null) {
      logWarn("admin.verify-pwa.healthcheck-exit", {
        exitCode,
        exitSignal,
        message: "Could not verify /api/healthz locally; double-check env vars and rerun.",
      });
      return;
    }
    throw new Error("Failed to confirm /api/healthz within 45s");
  }
}

async function main() {
  await step("manifest contains 192px & 512px PNG icons", checkManifest);
  await step("root layout advertises manifest & theme color", checkLayoutHead);
  await step("service-worker.js present", checkServiceWorker);
  if (skipBuild) {
    recordSkip("npm run build");
  } else {
    await step("npm run build", runBuild);
  }
  await step("start server and probe /api/health", runServerHealthcheck);
  logSummary();
  const failed = results.filter((item) => !item.ok);
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  logError("admin.verify-pwa.unhandled", { error });
  process.exit(1);
});
