#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";

async function main() {
  const targetDir = process.argv[2];

  if (!targetDir) {
    console.error("Usage: prepare-cjs <output-directory>");
    process.exit(1);
  }

  const resolvedDir = path.resolve(process.cwd(), targetDir);
  const packageJsonPath = path.join(resolvedDir, "package.json");

  await fs.mkdir(resolvedDir, { recursive: true });

  const packageJson = {
    type: "commonjs",
  };

  await fs.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
