import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const WORKSPACES = ["apps/pwa/staff-admin", "apps/platform-api", "apps/pwa/client", "packages/ui"];

async function cleanWorkspace(dir) {
  const coverageDir = path.join(dir, "coverage");
  const nycDir = path.join(dir, ".nyc_output");
  await rm(coverageDir, { recursive: true, force: true });
  await rm(nycDir, { recursive: true, force: true });
}

async function main() {
  for (const rel of WORKSPACES) {
    const abs = path.join(repoRoot, rel);
    await cleanWorkspace(abs);
  }

  const reportsDir = path.join(repoRoot, ".reports");
  await mkdir(reportsDir, { recursive: true });
  await rm(path.join(reportsDir, "coverage"), { recursive: true, force: true });
  await rm(path.join(reportsDir, "security"), { recursive: true, force: true });
  await mkdir(path.join(reportsDir, "coverage"), { recursive: true });
  await mkdir(path.join(reportsDir, "security"), { recursive: true });
}

main().catch((error) => {
  console.error("Failed to prepare coverage directories:", error);
  process.exitCode = 1;
});
