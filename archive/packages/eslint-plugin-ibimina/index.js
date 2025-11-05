import structuredLogging from "./rules/structured-logging.js";
import requireRetryOptions from "./rules/require-retry-options.js";

export const rules = {
  "structured-logging": structuredLogging,
  "require-retry-options": requireRetryOptions,
};

export default {
  meta: {
    name: "@ibimina/eslint-plugin",
    version: "0.1.0",
  },
  rules,
};
