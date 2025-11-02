import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mobileDir = path.resolve(__dirname, "..");
const distDir = path.join(mobileDir, "dist");

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

const easArgs = [
  "build",
  "--platform",
  "ios",
  "--profile",
  "production",
  "--non-interactive",
  "--wait",
  "--json",
];

const child = spawn("eas", easArgs, {
  cwd: mobileDir,
  stdio: ["inherit", "pipe", "inherit"],
});

let stdout = "";
child.stdout.setEncoding("utf-8");
child.stdout.on("data", (chunk) => {
  stdout += chunk;
  process.stdout.write(chunk);
});

const exitCode = await new Promise((resolve, reject) => {
  child.on("error", reject);
  child.on("close", resolve);
});

if (exitCode !== 0) {
  process.exit(exitCode ?? 1);
}

const buildOutputPath = path.join(distDir, "eas-ios-build.json");
writeFileSync(buildOutputPath, stdout, "utf-8");

let buildInfo;
try {
  buildInfo = JSON.parse(stdout);
} catch (error) {
  console.error("Failed to parse EAS build JSON output.");
  throw error;
}

const builds = Array.isArray(buildInfo) ? buildInfo : [buildInfo];
if (builds.length === 0) {
  throw new Error("EAS build JSON output did not contain any build metadata.");
}

const [latestBuild] = builds;
const artifactUrl = latestBuild?.artifacts?.buildUrl;
if (!artifactUrl) {
  throw new Error("EAS build JSON output is missing the artifact URL.");
}

const response = await fetch(artifactUrl);
if (!response.ok || !response.body) {
  throw new Error(
    `Failed to download iOS build artifact: ${response.status} ${response.statusText}`
  );
}

const artifactPath = path.join(distDir, "Ibimina.ipa");
const downloadStream = Readable.fromWeb(response.body);
await pipeline(downloadStream, createWriteStream(artifactPath));

console.log(`Downloaded iOS IPA to ${artifactPath}`);
