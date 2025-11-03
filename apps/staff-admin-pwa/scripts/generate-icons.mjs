#!/usr/bin/env node

import { generateImages } from 'pwa-asset-generator';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logoPath = join(__dirname, '../public/assets/logo.svg');
const outputPath = join(__dirname, '../public/assets/icons');

console.log('Generating PWA icons...');

generateImages(
  logoPath,
  outputPath,
  {
    scrape: false,
    background: '#1976d2',
    quality: 100,
    iconOnly: true,
    favicon: true,
    maskable: true,
    type: 'png',
    log: true,
  }
).then(() => {
  console.log('✓ Icons generated successfully');
}).catch((error) => {
  console.error('Failed to generate icons:', error);
  process.exit(1);
});
