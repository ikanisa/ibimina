import { writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: prepare-cjs.mjs <directory>');
  process.exit(1);
}

if (!existsSync(dir)) {
  console.error(`Directory ${dir} does not exist`);
  process.exit(1);
}

// Create package.json in the CJS directory to mark it as CommonJS
writeFileSync(join(dir, 'package.json'), JSON.stringify({ type: 'commonjs' }, null, 2));
console.log(`Created ${dir}/package.json`);
