#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "BACKUP_PEPPER",
  "MFA_SESSION_SECRET",
  "TRUSTED_COOKIE_SECRET",
  "HMAC_SHARED_SECRET",
  "KMS_DATA_KEY_BASE64",
];

const OPTIONAL_ENV_VARS = ["OPENAI_API_KEY", "SENTRY_DSN", "POSTHOG_API_KEY", "LOG_DRAIN_URL"];

const PLACEHOLDER_PATTERNS = [
  /placeholder/i,
  /stub/i,
  /example\.com/i,
  /your-project/i,
  /service-role-key/i,
  /anon-key/i,
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  const content = fs.readFileSync(filePath, "utf8");

  content.split(/\r?\n/).forEach((line) => {
    if (!line || line.trim().startsWith("#")) return;
    const [key, ...rest] = line.split("=");
    if (!key) return;
    const value = rest
      .join("=")
      .trim()
      .replace(/^['"]|['"]$/g, "");
    env[key.trim()] = value;
  });

  return env;
}

function loadEnvSources() {
  const root = process.cwd();
  const sources = [".env", ".env.local", "supabase/.env", "supabase/.env.local"];
  const merged = {};

  sources.forEach((file) => {
    const absolute = path.join(root, file);
    Object.assign(merged, parseEnvFile(absolute));
  });

  return { ...merged, ...process.env };
}

function ensureEnvFiles() {
  const envPath = path.join(process.cwd(), ".env");
  const envExamplePath = path.join(process.cwd(), ".env.example");

  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    console.log("⚠️  No .env file found!");
    console.log("📝 Creating .env from .env.example...\n");
    fs.copyFileSync(envExamplePath, envPath);
    console.log("✅ .env file created. Please update the values.\n");
  }
}

function isMissing(value) {
  if (!value || value.trim().length === 0) return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

function checkEnvVars() {
  console.log("🔍 Checking environment variables...\n");

  ensureEnvFiles();
  const env = loadEnvSources();

  const missing = [];
  const optionalMissing = [];

  REQUIRED_ENV_VARS.forEach((varName) => {
    const value = env[varName];
    if (isMissing(value)) {
      missing.push(varName);
    }
  });

  OPTIONAL_ENV_VARS.forEach((varName) => {
    if (isMissing(env[varName])) {
      optionalMissing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.log("❌ Missing required environment variables:");
    missing.forEach((varName) => {
      console.log(`   - ${varName}`);
    });
    console.log(
      "\n📖 Please set these variables in your .env/.env.local files or export them in your shell."
    );
    console.log("   See .env.example for the full list of required variables.\n");
    process.exit(1);
  }

  if (optionalMissing.length > 0) {
    console.log("⚠️  Optional environment variables not set:");
    optionalMissing.forEach((varName) => {
      console.log(`   - ${varName}`);
    });
    console.log("\n💡 These are optional but recommended for full functionality.\n");
  }

  console.log("✅ All required environment variables are set!\n");

  const needsSecrets = REQUIRED_ENV_VARS.filter((varName) => {
    const value = env[varName];
    return !value || value.length < 32;
  });

  if (needsSecrets.length > 0) {
    console.log("🔐 Generate secure secrets with these commands:\n");
    needsSecrets.forEach((varName) => {
      if (varName.includes("BASE64")) {
        console.log(`export ${varName}=$(openssl rand -base64 32)`);
      } else {
        console.log(`export ${varName}=$(openssl rand -hex 32)`);
      }
    });
    console.log("");
  }
}

try {
  checkEnvVars();
} catch (error) {
  console.error("❌ Error checking environment variables:", error.message);
  process.exit(1);
}
