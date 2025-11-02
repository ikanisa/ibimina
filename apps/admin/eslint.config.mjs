import reactHooks from "eslint-plugin-react-hooks";

import ibiminaPlugin from "../../packages/eslint-plugin-ibimina/index.js";
import { createEslintConfig } from "../../config/tooling/eslint/factory.mjs";
import { sharedReactRules, structuredLoggingRules } from "../../config/tooling/eslint/shared-rules.mjs";

export default createEslintConfig({
  ignores: [
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "public/**",
    "next-env.d.ts",
    ".tmp/**",
    "legacy/**",
    "legacy-src/**",
    "legacy-public/**",
    "../../supabase/functions/**",
  ],
  plugins: {
    "react-hooks": reactHooks,
    ibimina: ibiminaPlugin,
  },
  rules: { ...sharedReactRules, ...structuredLoggingRules },
});
