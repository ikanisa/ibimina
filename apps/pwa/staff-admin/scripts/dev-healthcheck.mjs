#!/usr/bin/env node
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

import { logError, logResult } from "./utils/logger.mjs";

const PORT = Number(process.env.DEV_HEALTH_PORT ?? 3200);
const HOST = "127.0.0.1";
const BASE = `http://${HOST}:${PORT}`;

const results = [];

async function step(name, fn) {
  try {
    await fn();
    const result = { name, ok: true };
    results.push(result);
    logResult("admin.dev-healthcheck.step", result);
  } catch (error) {
    const result = { name, ok: false, error };
    results.push(result);
    logResult("admin.dev-healthcheck.step", result);
  }
}

function logSummary() {
  for (const item of results) {
    logResult("admin.dev-healthcheck.summary", {
      name: item.name,
      ok: item.ok,
      error: item.error,
    });
  }
}

async function fetchOk(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`);
}

async function run() {
  const nextBin =
    process.platform === "win32" ? "node_modules/.bin/next.cmd" : "node_modules/.bin/next";
  const server = spawn(nextBin, ["dev", "-p", String(PORT), "-H", HOST], {
    stdio: "inherit",
    env: { ...process.env },
  });

  let started = false;
  for (let i = 0; i < 20; i += 1) {
    await sleep(1500);
    try {
      await fetchOk("/api/health");
      started = true;
      break;
    } catch {}
  }

  if (!started) {
    server.kill("SIGINT");
    await new Promise((r) => server.on("close", r));
    throw new Error("Dev server did not become healthy in time");
  }

  await step("GET /api/health", async () => fetchOk("/api/health"));
  await step("GET /login", async () => fetchOk("/login"));
  await step("GET /", async () => fetchOk("/"));

  server.kill("SIGINT");
  await new Promise((r) => server.on("close", r));

  logSummary();
  const failed = results.filter((r) => !r.ok);
  if (failed.length) process.exit(1);
}

run().catch((err) => {
  logError("admin.dev-healthcheck.unhandled", { error: err });
  process.exit(1);
});
