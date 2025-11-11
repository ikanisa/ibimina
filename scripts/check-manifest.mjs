#!/usr/bin/env node
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

const manifestPath = resolve("apps/pwa/client/public/manifest.json");

const requiredIconSizes = [
  { size: "192x192", purpose: "maskable" },
  { size: "512x512", purpose: "maskable" },
];

const exitWithError = (message) => {
  console.error(`\u274c ${message}`);
  process.exitCode = 1;
};

const assert = (condition, message) => {
  if (!condition) {
    exitWithError(message);
  }
};

const fileExists = async (relativePath) => {
  const path = resolve("apps/pwa/client/public", relativePath.replace(/^\//, ""));
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
};

const main = async () => {
  const raw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw);

  assert(
    Array.isArray(manifest.icons) && manifest.icons.length > 0,
    "Manifest must declare at least one icon entry"
  );

  for (const { size, purpose } of requiredIconSizes) {
    const icon = manifest.icons.find((entry) => entry.sizes?.split(/\s+/).includes(size));
    assert(icon, `Missing icon of size ${size}`);
    assert(icon.type, `Icon ${size} must declare a MIME type`);
    if (purpose) {
      assert(
        icon.purpose?.split(/\s+/).includes(purpose),
        `Icon ${size} must include purpose \"${purpose}\"`
      );
    }
    const iconExists = await fileExists(icon.src ?? "");
    assert(iconExists, `Icon asset not found at ${icon.src}`);
  }

  assert(
    Array.isArray(manifest.screenshots) && manifest.screenshots.length > 0,
    "Manifest must include screenshots array"
  );

  for (const screenshot of manifest.screenshots) {
    assert(
      typeof screenshot.src === "string" && screenshot.src.length > 0,
      "Screenshot entries must define src"
    );
    assert(
      typeof screenshot.type === "string" && screenshot.type.length > 0,
      "Screenshot entries must define a MIME type"
    );
    assert(
      typeof screenshot.sizes === "string" && screenshot.sizes.length > 0,
      "Screenshot entries must define dimensions"
    );
    const screenshotExists = await fileExists(screenshot.src);
    assert(screenshotExists, `Screenshot asset not found at ${screenshot.src}`);
  }

  const shareTarget = manifest.share_target;
  assert(shareTarget, "Manifest must define a share_target");
  assert(
    typeof shareTarget.action === "string" && shareTarget.action.length > 0,
    "share_target.action is required"
  );
  assert(
    typeof shareTarget.method === "string" && shareTarget.method.length > 0,
    "share_target.method is required"
  );
  assert(
    typeof shareTarget.enctype === "string" && shareTarget.enctype.length > 0,
    "share_target.enctype is required"
  );

  const params = shareTarget.params;
  assert(params && typeof params === "object", "share_target.params must be an object");
  for (const key of ["title", "text", "url"]) {
    assert(
      typeof params[key] === "string" && params[key].length > 0,
      `share_target.params must define \"${key}\"`
    );
  }

  console.log("\u2705 PWA manifest validation passed.");
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
