#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve, relative } from "node:path";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDirectory, "../../..");
const eslintConfig = resolve(repoRoot, "eslint.config.mjs");

const projectCwd = process.cwd();
const userArgs = process.argv.slice(2);

const mappedArgs = userArgs.map((arg) => {
  if (arg.startsWith("-")) {
    return arg;
  }

  const absolute = resolve(projectCwd, arg);
  if (!absolute.startsWith(repoRoot)) {
    return absolute;
  }

  const rel = relative(repoRoot, absolute);
  return rel.length === 0 ? "." : rel;
});

const pnpmArgs = [
  "--workspace-root",
  "exec",
  "eslint",
  "--max-warnings=0",
  "--config",
  eslintConfig,
  ...mappedArgs,
];

const result = spawnSync("pnpm", pnpmArgs, {
  stdio: "inherit",
  cwd: repoRoot,
  env: process.env,
});

if (result.error) {
  console.error("Failed to launch pnpm exec eslint:", result.error);
  process.exit(result.status ?? 1);
}

process.exit(result.status ?? 0);
