export const sharedReactRules = {
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: false }],
  "react-hooks/rules-of-hooks": "error",
  "react-hooks/exhaustive-deps": "warn",
  "react-hooks/set-state-in-effect": "off",
};

export const structuredLoggingRules = {
  "ibimina/structured-logging": "error",
  "ibimina/require-retry-options": ["error", { functions: ["invokeEdge"] }],
  "ibimina/no-private-imports": "error",
};
