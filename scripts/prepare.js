#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

async function prepare() {
  console.log("🚀 Preparing repository for deployment...\n");

  // Step 1: Check Node version
  console.log("📋 Checking Node.js version...");
  try {
    const { stdout } = await execAsync("node --version");
    const version = stdout.trim();
    // Handle both 'v20.0.0' and '20.0.0' formats
    const majorVersion = parseInt(version.replace(/^v/, "").split(".")[0]);

    if (majorVersion < 20) {
      console.log(`   ❌ Node.js ${version} detected. Requires Node.js 20+`);
      console.log("   Install with: nvm install 20 && nvm use 20\n");
      process.exit(1);
    }
    console.log(`   ✅ Node.js ${version}\n`);
  } catch (error) {
    console.log("   ❌ Error checking Node.js version\n");
    process.exit(1);
  }

  // Step 2: Check pnpm
  console.log("📦 Checking pnpm...");
  try {
    const { stdout } = await execAsync("pnpm --version");
    console.log(`   ✅ pnpm ${stdout.trim()}\n`);
  } catch (error) {
    console.log("   ❌ pnpm not found");
    console.log("   Install with: npm install -g pnpm@10.19.0\n");
    process.exit(1);
  }

  // Step 3: Check environment
  console.log("🔍 Checking environment variables...");
  const envPath = path.join(process.cwd(), ".env");

  if (!fs.existsSync(envPath)) {
    console.log("   ⚠️  No .env file found");
    console.log("   Run: pnpm check:env\n");
  } else {
    console.log("   ✅ .env file found\n");
  }

  // Step 4: Install dependencies
  console.log("📥 Installing dependencies...");
  try {
    await execAsync("pnpm install --frozen-lockfile", {
      maxBuffer: 10 * 1024 * 1024,
    });
    console.log("   ✅ Dependencies installed\n");
  } catch (error) {
    console.log("   ❌ Failed to install dependencies");
    console.log(`   ${error.message}\n`);
    process.exit(1);
  }

  // Step 5: Generate PWA manifests
  console.log("🎨 Generating PWA manifests...");
  try {
    await execAsync("node scripts/generate-pwa.js");
    console.log("   ✅ PWA manifests generated\n");
  } catch (error) {
    console.log("   ⚠️  Warning: PWA manifest generation failed");
    console.log(`   ${error.message}\n`);
  }

  // Step 6: Check TypeScript
  console.log("🔧 Type checking...");
  try {
    await execAsync("pnpm run typecheck", { maxBuffer: 10 * 1024 * 1024 });
    console.log("   ✅ TypeScript check passed\n");
  } catch (error) {
    console.log("   ⚠️  TypeScript errors found");
    console.log("   Run: pnpm typecheck for details\n");
  }

  // Step 7: Lint
  console.log("🧹 Linting...");
  try {
    await execAsync("pnpm run lint", { maxBuffer: 10 * 1024 * 1024 });
    console.log("   ✅ Linting passed\n");
  } catch (error) {
    console.log("   ⚠️  Linting issues found");
    console.log("   Run: pnpm run format to auto-fix\n");
  }

  // Summary
  console.log("=".repeat(50));
  console.log("✨ Repository preparation complete!\n");
  console.log("📝 Next steps:");
  console.log("   1. Update .env with your values");
  console.log("   2. Build: pnpm build");
  console.log("   3. Test: pnpm test");
  console.log("   4. Deploy: pnpm deploy:netlify");
  console.log("=".repeat(50));
}

// Run preparation
prepare().catch((error) => {
  console.error("❌ Fatal error:", error.message);
  process.exit(1);
});
