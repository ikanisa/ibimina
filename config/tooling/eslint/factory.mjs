import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

const DEFAULT_IGNORES = [
  "**/.turbo/**",
  "**/.next/**",
  "**/.nuxt/**",
  "**/.svelte-kit/**",
  "**/.vercel/**",
  "**/build/**",
  "**/coverage/**",
  "**/dist/**",
  "**/node_modules/**",
  "pnpm-lock.yaml",
];

const GLOBAL_TARGETS = {
  browser: globals.browser,
  node: globals.node,
  worker: globals.worker,
};

function mergeGlobals(targets = ["browser", "node"]) {
  return targets.reduce((accumulator, target) => {
    const value = GLOBAL_TARGETS[target];

    if (!value) {
      return accumulator;
    }

    return { ...accumulator, ...value };
  }, {});
}

export function createEslintConfig({
  files = ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
  ignores = [],
  globalTargets = ["browser", "node"],
  parserOptions = {},
  plugins = {},
  rules = {},
  jsx = true,
  includeIgnores = true,
  includePrettier = true,
  linterOptions,
  extraConfigs = [],
} = {}) {
  const configuration = [];

  if (includeIgnores) {
    const ignoreEntry = {
      ignores: Array.from(new Set([...DEFAULT_IGNORES, ...ignores])),
    };

    if (linterOptions) {
      ignoreEntry.linterOptions = linterOptions;
    }

    configuration.push(ignoreEntry);
  }

  const mergedParserOptions = {
    ecmaVersion: "latest",
    sourceType: "module",
    ...parserOptions,
  };

  if (jsx) {
    mergedParserOptions.ecmaFeatures = {
      ...(mergedParserOptions.ecmaFeatures ?? {}),
      jsx: true,
    };
  }

  configuration.push({
    files: Array.isArray(files) ? files : [files],
    languageOptions: {
      parser: tsParser,
      parserOptions: mergedParserOptions,
      globals: mergeGlobals(globalTargets),
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      prettier: prettierPlugin,
      ...plugins,
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "prettier/prettier": "warn",
      ...rules,
    },
  });

  if (includePrettier) {
    configuration.push(prettierConfig);
  }

  configuration.push(...extraConfigs);

  return configuration;
}
