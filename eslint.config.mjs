import reactHooks from "eslint-plugin-react-hooks";

import { createEslintConfig } from "./config/tooling/eslint/factory.mjs";
import { sharedReactRules, structuredLoggingRules } from "./config/tooling/eslint/shared-rules.mjs";

const baseConfig = createEslintConfig({
  ignores: [
    "apps/pwa/staff-admin/.next/**",
    "apps/pwa/staff-admin/.turbo/**",
    "apps/pwa/staff-admin/public/**/*",
    "apps/pwa/staff-admin/android/**",
    "apps/pwa/staff-admin/scripts/**/*",
    "apps/pwa/staff-admin/tests/**/*",
    "apps/desktop/staff-admin/src-tauri/**",
    "infra/scripts/**",
  ],
  plugins: {
    "react-hooks": reactHooks,
  },
  rules: {
    ...sharedReactRules,
    ...structuredLoggingRules,
    // Disable type-aware rules at root level since we don't have parserOptions.project
    // Each app can re-enable these in their own config if needed
    "@typescript-eslint/no-floating-promises": "off",
    "@typescript-eslint/no-misused-promises": "off",
  },
  linterOptions: {
    reportUnusedDisableDirectives: "off",
  },
});

export default baseConfig;
