#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

const [, , targetDir] = process.argv;

if (!targetDir) {
  console.error('Usage: node prepare-cjs.mjs <output-directory>');
  process.exit(1);
}

const resolvedTargetDir = path.resolve(process.cwd(), targetDir);

async function ensureCommonJsPackageJson(directory) {
  const packageJsonPath = path.join(directory, 'package.json');
  let packageJson = {};

  try {
    const existing = await fs.readFile(packageJsonPath, 'utf8');
    packageJson = JSON.parse(existing);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  if (packageJson.type === 'commonjs') {
    return;
  }

  const updated = { ...packageJson, type: 'commonjs' };
  const contents = `${JSON.stringify(updated, null, 2)}\n`;

  await fs.writeFile(packageJsonPath, contents, 'utf8');
}

async function run() {
  try {
    await fs.access(resolvedTargetDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Output directory not found: ${resolvedTargetDir}`);
      process.exit(1);
    }

    throw error;
  }

  await ensureCommonJsPackageJson(resolvedTargetDir);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
