#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

const APPS = ["admin", "client"];

async function checkNetlifyCLI() {
  try {
    await execAsync("netlify --version");
    return true;
  } catch (error) {
    console.log("❌ Netlify CLI not found");
    console.log("   Install with: npm install -g netlify-cli\n");
    return false;
  }
}

async function deployApp(appName, production = false) {
  const appPath = path.join(__dirname, "..", "apps", appName);
  const buildPath = path.join(appPath, ".next");

  console.log(`\n🚀 Deploying ${appName} to Netlify...\n`);

  // Check if build exists
  if (!fs.existsSync(buildPath)) {
    console.log(`   ❌ Build not found: ${buildPath}`);
    console.log(`   Run: pnpm build:${appName}\n`);
    return false;
  }

  // Get site ID from environment or config
  const siteIdEnv = `NETLIFY_SITE_ID_${appName.toUpperCase()}`;
  const siteId = process.env[siteIdEnv];

  if (!siteId) {
    console.log(`   ⚠️  No site ID found for ${appName}`);
    console.log(`   Set ${siteIdEnv} environment variable`);
    console.log(`   Or deploy manually: cd apps/${appName} && netlify deploy\n`);
    return false;
  }

  try {
    const prodFlag = production ? "--prod" : "";
    // Use array of arguments to prevent command injection
    const args = ["deploy", "--dir=.next"];
    if (production) {
      args.push("--prod");
    }
    args.push(`--site=${siteId}`);

    console.log(`   📦 Deploying...`);
    // Change directory and execute netlify with proper arguments
    const command = `cd "${appPath}" && netlify ${args.join(" ")}`;
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024,
    });

    console.log(stdout);

    if (stderr && !stderr.includes("warning")) {
      console.log(`   ⚠️  Warnings:\n${stderr}`);
    }

    console.log(`   ✅ ${appName} deployed successfully!\n`);
    return true;
  } catch (error) {
    console.error(`   ❌ Deployment failed: ${error.message}\n`);
    return false;
  }
}

async function deployAll() {
  console.log("🚀 Starting Netlify deployment...\n");

  // Check CLI
  if (!(await checkNetlifyCLI())) {
    process.exit(1);
  }

  // Check for production flag
  const isProduction = process.argv.includes("--prod") || process.argv.includes("--production");
  const deployType = isProduction ? "production" : "preview";

  console.log(`📝 Deployment type: ${deployType}`);
  console.log(`📝 Apps to deploy: ${APPS.join(", ")}\n`);

  if (!isProduction) {
    console.log("💡 Add --prod flag to deploy to production\n");
  }

  // Deploy each app
  const results = [];

  for (const appName of APPS) {
    const success = await deployApp(appName, isProduction);
    results.push({ appName, success });
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Deployment Summary\n");

  results.forEach(({ appName, success }) => {
    const status = success ? "✅" : "❌";
    console.log(`${status} ${appName}`);
  });

  const successCount = results.filter((r) => r.success).length;
  console.log(`\n${successCount}/${results.length} apps deployed successfully`);
  console.log("=".repeat(50) + "\n");

  if (successCount === 0) {
    console.log("💡 Setup steps:");
    console.log("   1. Install Netlify CLI: npm install -g netlify-cli");
    console.log("   2. Login: netlify login");
    console.log("   3. Link sites: cd apps/pwa/staff-admin && netlify link");
    console.log("   4. Set environment variables in Netlify dashboard");
    console.log("   5. Build apps: pnpm build");
    console.log("   6. Deploy: pnpm deploy:netlify\n");
    process.exit(1);
  }

  console.log("✨ Deployment complete!\n");
}

// Run deployment
deployAll().catch((error) => {
  console.error("❌ Fatal error:", error.message);
  process.exit(1);
});
