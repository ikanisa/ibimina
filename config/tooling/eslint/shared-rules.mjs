export const sharedReactRules = {
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: false }],
  "react-hooks/rules-of-hooks": "error",
  "react-hooks/exhaustive-deps": "warn",
  "react-hooks/set-state-in-effect": "off",
};

// Note: The ibimina eslint plugin was removed during the repository refactoring.
// If custom linting rules are needed in the future, consider:
// 1. Creating a new eslint plugin in packages/
// 2. Using existing eslint rules from the ecosystem
export const structuredLoggingRules = {};
