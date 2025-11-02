import reactHooks from "eslint-plugin-react-hooks";

import ibiminaPlugin from "./packages/eslint-plugin-ibimina/index.js";
import { createEslintConfig } from "./config/tooling/eslint/factory.mjs";
import { sharedReactRules, structuredLoggingRules } from "./config/tooling/eslint/shared-rules.mjs";

const baseConfig = createEslintConfig({
  ignores: [
    "apps/admin/.next/**",
    "apps/admin/.turbo/**",
    "apps/admin/public/**/*",
    "apps/client/.next/**",
    "apps/client/public/**/*",
    "infra/scripts/**",
  ],
  plugins: {
    "react-hooks": reactHooks,
    ibimina: ibiminaPlugin,
  },
  rules: { ...sharedReactRules, ...structuredLoggingRules },
  linterOptions: {
    reportUnusedDisableDirectives: "off",
  },
});

const nodeApiOverrides = createEslintConfig({
  files: ["apps/platform-api/**/*.{ts,tsx}", "packages/api/**/*.{ts,tsx}"],
  globalTargets: ["node"],
  jsx: false,
  includeIgnores: false,
  includePrettier: false,
});

export default [...baseConfig, ...nodeApiOverrides];
