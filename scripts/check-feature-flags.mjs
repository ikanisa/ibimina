#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.resolve(__dirname, "../config/required-flags.json");

let requiredConfig;
try {
  const configContents = await readFile(configPath, "utf8");
  requiredConfig = JSON.parse(configContents);
} catch (error) {
  console.error(`Failed to load required flags from ${configPath}:`, error);
  process.exit(1);
}

const requiredFlags = Array.isArray(requiredConfig)
  ? requiredConfig
  : Array.isArray(requiredConfig.flags)
    ? requiredConfig.flags
    : [];

if (requiredFlags.length === 0) {
  console.error(
    'No required flags defined. Ensure config/required-flags.json exports an array or { "flags": [] }.'
  );
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("SUPABASE_URL environment variable is required to verify feature flags.");
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY environment variable is required to verify feature flags."
  );
  process.exit(1);
}

const endpoint = `${supabaseUrl}/rest/v1/configuration?select=value&key=eq.feature_flags`;

let response;
try {
  response = await fetch(endpoint, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json",
    },
  });
} catch (error) {
  console.error("Failed to contact Supabase to verify feature flags:", error);
  process.exit(1);
}

if (!response.ok) {
  const body = await response.text();
  console.error(
    `Supabase returned an error when fetching feature flags (status ${response.status}):\n${body}`
  );
  process.exit(1);
}

let payload;
try {
  payload = await response.json();
} catch (error) {
  console.error("Unable to parse feature flag response as JSON:", error);
  process.exit(1);
}

if (!Array.isArray(payload) || payload.length === 0) {
  console.error(
    "Supabase configuration row for feature_flags is missing. Ensure the configuration table is seeded."
  );
  process.exit(1);
}

const configurationRow = payload[0];
const flags = configurationRow?.value ?? {};

if (flags === null || typeof flags !== "object") {
  console.error(
    "Supabase returned an invalid feature flag payload. Expected an object map of flags."
  );
  process.exit(1);
}

const missingFlags = [];
const invalidFlags = [];

for (const flag of requiredFlags) {
  if (!(flag in flags)) {
    missingFlags.push(flag);
    continue;
  }

  const value = flags[flag];
  if (value === null || value === undefined) {
    missingFlags.push(flag);
    continue;
  }

  if (typeof value !== "boolean") {
    invalidFlags.push({ flag, value });
  }
}

if (missingFlags.length > 0 || invalidFlags.length > 0) {
  if (missingFlags.length > 0) {
    console.error(
      `Missing required feature flag(s): ${missingFlags.map((flag) => `"${flag}"`).join(", ")}`
    );
  }

  if (invalidFlags.length > 0) {
    const details = invalidFlags
      .map(({ flag, value }) => `"${flag}" (received: ${JSON.stringify(value)})`)
      .join(", ");
    console.error(`Feature flag(s) must be boolean values: ${details}`);
  }

  process.exit(1);
}

console.log(`All required feature flags are set: ${requiredFlags.join(", ")}`);
