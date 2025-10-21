#!/usr/bin/env node
import { execSync } from "node:child_process";
import process from "node:process";
import envRequirements from "../config/required-env.json" assert { type: "json" };

const trim = (value) => (typeof value === "string" ? value.trim() : "");
const formatError = (error) => (error instanceof Error ? error.message : String(error));

const requiredVars = envRequirements.required ?? [];
const missingVars = requiredVars.filter((key) => !trim(process.env[key]));

const missingGroups = (envRequirements.atLeastOne ?? [])
  .map((group) => ({ group, present: group.some((key) => trim(process.env[key])) }))
  .filter(({ present }) => !present)
  .map(({ group }) => group);

if (missingVars.length > 0 || missingGroups.length > 0) {
  console.error("[env] Missing required environment variables:");
  if (missingVars.length > 0) {
    console.error(`  - ${missingVars.join(", ")}`);
  }
  for (const group of missingGroups) {
    console.error(`  - at least one of ${group.join(", ")}`);
  }
  process.exit(1);
}

const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
if (!Number.isNaN(nodeMajor) && nodeMajor !== 18) {
  console.error(`[env] Expected Node.js 18.x but found ${process.versions.node}.`);
  process.exit(1);
}

const run = (command) => {
  execSync(command, { stdio: "inherit", env: process.env });
};

try {
  run("corepack enable");
} catch (error) {
  console.warn(`[preflight] corepack enable failed: ${formatError(error)}`);
}

try {
  run("pnpm --version");
} catch (error) {
  console.error(`[preflight] pnpm is not available. Install via corepack before retrying. (${formatError(error)})`);
  process.exit(1);
}

const environmentArg = process.argv.find((arg) => arg.startsWith("--environment="));
const environment = environmentArg ? environmentArg.split("=")[1] ?? "preview" : "preview";
const buildFlag = environment === "production" ? " --prod" : "";
const tokenFlag = process.env.VERCEL_TOKEN ? ` --token=${process.env.VERCEL_TOKEN}` : "";

const pullCommand = `pnpm dlx vercel@latest pull --yes --environment=${environment}${tokenFlag}`;
const buildCommand = `pnpm dlx vercel@latest build${buildFlag}${tokenFlag}`;

console.log(`[preflight] ${pullCommand}`);
run(pullCommand);

console.log(`[preflight] ${buildCommand}`);
run(buildCommand);

console.log("[preflight] Vercel build succeeded.");
