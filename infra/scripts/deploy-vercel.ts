#!/usr/bin/env ts-node

import { spawn } from "node:child_process";
import { cwd } from "node:process";

const requiredEnv = [
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_PROJECT_REF",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VERCEL_ORG_ID",
  "VERCEL_PROJECT_ID",
  "VERCEL_TOKEN",
];

const requireEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const runCommand = (
  command: string,
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv }
) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      cwd: options.cwd,
      env: options.env,
      shell: process.platform === "win32",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
      }
    });

    child.on("error", reject);
  });

async function main() {
  for (const key of requiredEnv) {
    requireEnv(key);
  }

  const supabaseEnv = {
    ...process.env,
    SUPABASE_ACCESS_TOKEN: requireEnv("SUPABASE_ACCESS_TOKEN"),
  };

  const projectRef = requireEnv("SUPABASE_PROJECT_REF");

  console.info("Deploying Supabase WhatsApp OTP functions...");
  await runCommand(
    "supabase",
    ["functions", "deploy", "whatsapp-otp-send", "--project-ref", projectRef, "--no-verify-jwt"],
    {
      cwd: `${cwd()}/supabase`,
      env: supabaseEnv,
    }
  );

  await runCommand(
    "supabase",
    ["functions", "deploy", "whatsapp-otp-verify", "--project-ref", projectRef, "--no-verify-jwt"],
    {
      cwd: `${cwd()}/supabase`,
      env: supabaseEnv,
    }
  );

  console.info("Deploying platform-api webhook to Vercel...");
  await runCommand(
    "vercel",
    [
      "deploy",
      "--prod",
      "--yes",
      "--scope",
      requireEnv("VERCEL_ORG_ID"),
      "--project",
      requireEnv("VERCEL_PROJECT_ID"),
    ],
    {
      cwd: `${cwd()}/apps/platform-api`,
      env: {
        ...process.env,
        VERCEL_TOKEN: requireEnv("VERCEL_TOKEN"),
      },
    }
  );

  console.info("Deployment completed successfully.");
}

main().catch((error) => {
  console.error("Deployment script failed", error);
  process.exitCode = 1;
});
