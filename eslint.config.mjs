import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: [
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "**/node_modules/**",
      "apps/admin/.next/**",
      "apps/admin/public/**/*",
      "apps/admin/.turbo/**",
      "pnpm-lock.yaml",
    ],
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
  },
  {
    files: [
      "apps/admin/app/**/*.{js,jsx,ts,tsx}",
      "apps/admin/components/**/*.{js,jsx,ts,tsx}",
      "apps/admin/lib/**/*.{js,jsx,ts,tsx}",
      "apps/admin/providers/**/*.{js,jsx,ts,tsx}",
      "apps/admin/scripts/**/*.{js,jsx,ts,tsx}",
      "apps/admin/tests/**/*.{js,jsx,ts,tsx}",
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "off",
    },
  },
];
