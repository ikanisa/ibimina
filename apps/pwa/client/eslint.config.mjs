import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import reactHooks from "eslint-plugin-react-hooks";

import ibiminaPlugin from "../../../packages/eslint-plugin-ibimina/index.js";
import { createEslintConfig } from "../../../config/tooling/eslint/factory.mjs";
import {
  sharedReactRules,
  structuredLoggingRules,
} from "../../../config/tooling/eslint/shared-rules.mjs";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const baseConfig = createEslintConfig({
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "public/**", "next-env.d.ts"],
  plugins: {
    "react-hooks": reactHooks,
    ibimina: ibiminaPlugin,
  },
  rules: { ...sharedReactRules, ...structuredLoggingRules },
});

const pageLiteralRules = createEslintConfig({
  files: ["app/(tabs)/home/page.tsx"],
  includeIgnores: false,
  includePrettier: false,
  plugins: { ibimina: ibiminaPlugin },
  rules: {
    "ibimina/no-inline-page-literals": "error",
  },
});

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  ...baseConfig,
  ...pageLiteralRules,
];
