#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const PWA_CONFIGS = {
  admin: {
    name: "Ibimina Staff Admin",
    short_name: "Staff Admin",
    description: "SACCO staff administration console",
    theme_color: "#2563eb",
    background_color: "#ffffff",
    start_url: "/",
    scope: "/",
    display: "standalone",
    icons: [
      { src: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { src: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { src: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
      { src: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png" },
      { src: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    categories: ["finance", "business", "productivity"],
  },
  client: {
    name: "Ibimina Client",
    short_name: "Ibimina",
    description: "SACCO member services and group savings",
    theme_color: "#059669",
    background_color: "#ffffff",
    start_url: "/",
    scope: "/",
    display: "standalone",
    icons: [
      { src: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { src: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { src: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
      { src: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png" },
      { src: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    categories: ["finance", "business"],
  },
};

async function generatePWAManifests() {
  console.log("🎨 Generating PWA manifests...\n");

  for (const [appName, config] of Object.entries(PWA_CONFIGS)) {
    const appPath = path.join(__dirname, "..", "apps", appName);
    const publicPath = path.join(appPath, "public");
    const manifestPath = path.join(publicPath, "manifest.json");

    if (!fs.existsSync(appPath)) {
      console.log(`⚠️  App directory not found: ${appName}`);
      continue;
    }

    // Ensure public directory exists
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath, { recursive: true });
    }

    // Write manifest
    fs.writeFileSync(manifestPath, JSON.stringify(config, null, 2));
    console.log(`✅ Generated manifest for ${appName}`);

    // Check if icons directory exists
    const iconsPath = path.join(publicPath, "icons");
    if (!fs.existsSync(iconsPath)) {
      console.log(`   ⚠️  Icons directory not found: ${iconsPath}`);
      console.log(`   💡 Create icons directory and add PWA icons`);
    }
  }

  console.log("\n✨ PWA manifests generated successfully!\n");
  console.log("📝 Next steps:");
  console.log("   1. Add PWA icons to public/icons/ in each app");
  console.log("   2. Test PWA with: pnpm dev");
  console.log("   3. Check PWA in Chrome DevTools > Application > Manifest\n");
}

// Run generation
generatePWAManifests().catch((error) => {
  console.error("❌ Error generating PWA manifests:", error.message);
  process.exit(1);
});
