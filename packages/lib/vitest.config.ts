import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "http://localhost",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test",
      SUPABASE_SERVICE_ROLE_KEY: "test",
      BACKUP_PEPPER: "test",
      MFA_SESSION_SECRET: "test",
      TRUSTED_COOKIE_SECRET: "test",
      OPENAI_API_KEY: "test",
      HMAC_SHARED_SECRET: "test",
      KMS_DATA_KEY: "MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI=",
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["**/*.d.ts"],
      reportsDirectory: "coverage",
      reporter: ["text", "lcov", "json-summary"],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@ibimina/config": path.resolve(__dirname, "../config/src/index.ts"),
    },
  },
});
