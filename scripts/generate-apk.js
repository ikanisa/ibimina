#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

const APPS_WITH_ANDROID = ["admin", "client"];

async function generateAPK(appName) {
  const appPath = path.join(__dirname, "..", "apps", appName);
  const androidPath = path.join(appPath, "android");

  console.log(`\n📱 Building APK for ${appName}...\n`);

  // Check if android directory exists
  if (!fs.existsSync(androidPath)) {
    console.log(`❌ Android directory not found: ${androidPath}`);
    console.log(`   Run: cd apps/${appName} && pnpm cap:sync:android\n`);
    return false;
  }

  try {
    // Sync Capacitor
    console.log(`   📦 Syncing Capacitor...`);
    await execAsync(`cd "${appPath}" && pnpm cap:sync:android`);

    // Build APK
    console.log(`   🔨 Building APK...`);
    const buildCommand = `cd "${androidPath}" && ./gradlew assembleRelease`;
    const { stdout, stderr } = await execAsync(buildCommand, {
      maxBuffer: 10 * 1024 * 1024,
    });

    if (stderr && !stderr.includes("warning")) {
      console.log(`   ⚠️  Build warnings:\n${stderr}`);
    }

    // Find the APK
    const apkPath = path.join(
      androidPath,
      "app",
      "build",
      "outputs",
      "apk",
      "release",
      "app-release.apk"
    );

    if (fs.existsSync(apkPath)) {
      const stats = fs.statSync(apkPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   ✅ APK built successfully: ${apkPath}`);
      console.log(`   📦 Size: ${sizeMB} MB\n`);

      // Copy to distribution directory
      const distDir = path.join(__dirname, "..", "dist");
      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().split("T")[0];
      const distPath = path.join(distDir, `${appName}-${timestamp}.apk`);
      fs.copyFileSync(apkPath, distPath);
      console.log(`   📂 Copied to: ${distPath}\n`);

      return true;
    } else {
      console.log(`   ❌ APK not found at expected location: ${apkPath}\n`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Error building APK: ${error.message}\n`);
    return false;
  }
}

async function generateAllAPKs() {
  console.log("🚀 Starting APK generation...\n");
  console.log("📝 Apps to build:", APPS_WITH_ANDROID.join(", "));

  const results = [];

  for (const appName of APPS_WITH_ANDROID) {
    const success = await generateAPK(appName);
    results.push({ appName, success });
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Build Summary\n");

  results.forEach(({ appName, success }) => {
    const status = success ? "✅" : "❌";
    console.log(`${status} ${appName}`);
  });

  const successCount = results.filter((r) => r.success).length;
  console.log(`\n${successCount}/${results.length} APKs built successfully`);
  console.log("=".repeat(50) + "\n");

  if (successCount === 0) {
    console.log("💡 Troubleshooting:");
    console.log("   1. Ensure Android SDK is installed");
    console.log("   2. Run: pnpm cap:sync:android in each app");
    console.log("   3. Check android/local.properties has correct SDK path");
    console.log("   4. Ensure Java 17 is installed\n");
    process.exit(1);
  }

  console.log("✨ APK generation complete!\n");
}

// Run generation
generateAllAPKs().catch((error) => {
  console.error("❌ Fatal error:", error.message);
  process.exit(1);
});
