#!/usr/bin/env node
/**
 * Post-process CJS build to add .js extensions and package.json type marker
 */
import { writeFileSync } from 'fs';
import { join } from 'path';

const [,, distPath] = process.argv;
if (!distPath) {
  console.error('Usage: prepare-cjs.mjs <dist-path>');
  process.exit(1);
}

// Write package.json to mark as CommonJS
writeFileSync(
  join(distPath, 'package.json'),
  JSON.stringify({ type: 'commonjs' }, null, 2)
);

console.log('✓ CJS build prepared');
