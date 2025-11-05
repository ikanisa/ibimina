#!/usr/bin/env node

/**
 * Generate Android app icons and splash screens
 * 
 * This script generates all required Android resources from the source logo.
 * Run: node scripts/generate-android-assets.mjs
 */

import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const LOGO_PATH = join(rootDir, 'public/assets/logo.svg');
const OUTPUT_DIR = join(rootDir, 'resources');

// Android icon sizes
const ANDROID_ICONS = [
  { size: 36, density: 'ldpi', folder: 'mipmap-ldpi' },
  { size: 48, density: 'mdpi', folder: 'mipmap-mdpi' },
  { size: 72, density: 'hdpi', folder: 'mipmap-hdpi' },
  { size: 96, density: 'xhdpi', folder: 'mipmap-xhdpi' },
  { size: 144, density: 'xxhdpi', folder: 'mipmap-xxhdpi' },
  { size: 192, density: 'xxxhdpi', folder: 'mipmap-xxxhdpi' },
];

// Android splash screen sizes
const ANDROID_SPLASH = [
  { width: 320, height: 480, density: 'port-ldpi' },
  { width: 480, height: 800, density: 'port-mdpi' },
  { width: 720, height: 1280, density: 'port-hdpi' },
  { width: 960, height: 1600, density: 'port-xhdpi' },
  { width: 1280, height: 1920, density: 'port-xxhdpi' },
  { width: 1920, height: 2560, density: 'port-xxxhdpi' },
];

async function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

async function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'inherit' });
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

async function generateAndroidIcons() {
  console.log('🎨 Generating Android app icons...\n');

  if (!existsSync(LOGO_PATH)) {
    console.error(`❌ Logo not found at ${LOGO_PATH}`);
    console.log('Please create a logo.svg file in public/assets/');
    process.exit(1);
  }

  // Create resources directory
  await ensureDir(OUTPUT_DIR);

  // Check if ImageMagick is available
  try {
    await runCommand('convert', ['-version']);
  } catch (error) {
    console.error('❌ ImageMagick is not installed.');
    console.log('\nPlease install ImageMagick:');
    console.log('  macOS:   brew install imagemagick');
    console.log('  Linux:   sudo apt-get install imagemagick');
    console.log('  Windows: https://imagemagick.org/script/download.php');
    console.log('\nOr use @capacitor/assets instead:');
    console.log('  npm install -g @capacitor/assets');
    console.log('  npx capacitor-assets generate');
    process.exit(1);
  }

  // Generate icons for each density
  for (const icon of ANDROID_ICONS) {
    const iconDir = join(OUTPUT_DIR, 'android', 'icon', icon.folder);
    await ensureDir(iconDir);

    const outputPath = join(iconDir, 'ic_launcher.png');

    console.log(`Generating ${icon.density} icon (${icon.size}x${icon.size})...`);

    await runCommand('convert', [
      LOGO_PATH,
      '-resize', `${icon.size}x${icon.size}`,
      '-background', 'transparent',
      '-gravity', 'center',
      '-extent', `${icon.size}x${icon.size}`,
      outputPath,
    ]);
  }

  console.log('\n✅ Android icons generated successfully!');
}

async function generateAndroidSplash() {
  console.log('\n🖼️  Generating Android splash screens...\n');

  for (const splash of ANDROID_SPLASH) {
    const splashDir = join(OUTPUT_DIR, 'android', 'splash', `drawable-${splash.density}`);
    await ensureDir(splashDir);

    const outputPath = join(splashDir, 'splash.png');

    console.log(`Generating ${splash.density} splash (${splash.width}x${splash.height})...`);

    await runCommand('convert', [
      '-size', `${splash.width}x${splash.height}`,
      'xc:#1976d2',
      '(',
      LOGO_PATH,
      '-resize', '40%',
      ')',
      '-gravity', 'center',
      '-composite',
      outputPath,
    ]);
  }

  console.log('\n✅ Android splash screens generated successfully!');
}

async function main() {
  try {
    console.log('🚀 Generating Android assets for Staff Admin PWA\n');
    console.log('This will create app icons and splash screens for Android.\n');

    await generateAndroidIcons();
    await generateAndroidSplash();

    console.log('\n✅ All Android assets generated!');
    console.log('\n📂 Assets created in: ' + OUTPUT_DIR);
    console.log('\n📝 Next steps:');
    console.log('1. Run: pnpm cap add android');
    console.log('2. Run: pnpm cap sync');
    console.log('3. Assets will be copied to android/app/src/main/res/');
  } catch (error) {
    console.error('\n❌ Error generating assets:', error.message);
    console.log('\n💡 Alternative: Use Capacitor Assets CLI');
    console.log('  npm install -g @capacitor/assets');
    console.log('  npx capacitor-assets generate');
    process.exit(1);
  }
}

main();
