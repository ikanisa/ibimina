/**
 * Custom ESLint plugin for Ibimina-specific rules
 * 
 * This plugin enforces project-specific coding standards for the Ibimina project.
 */

/**
 * Rule: structured-logging
 * Ensures console.log is not used; use structured logging instead
 */
const structuredLogging = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow console.log in favor of structured logging",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      noConsoleLog: "Use structured logging instead of console.log",
    },
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (
          node.object.name === "console" &&
          node.property.name === "log"
        ) {
          context.report({
            node,
            messageId: "noConsoleLog",
          });
        }
      },
    };
  },
};

/**
 * Rule: require-retry-options
 * Ensures specific functions are called with retry options
 */
const requireRetryOptions = {
  meta: {
    type: "problem",
    docs: {
      description: "Require retry options for specific function calls",
      category: "Best Practices",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          functions: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingRetryOptions: "Function '{{name}}' should be called with retry options",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const targetFunctions = options.functions || [];

    return {
      CallExpression(node) {
        // Handle both simple function calls and member expressions
        const calleeName = node.callee.type === "Identifier" ? node.callee.name : null;
        
        if (calleeName && targetFunctions.includes(calleeName)) {
          // Check if retry options are provided
          const hasRetryOptions = node.arguments.some(arg => {
            return (
              arg.type === "ObjectExpression" &&
              arg.properties.some(prop => 
                prop.key && prop.key.name === "retry"
              )
            );
          });

          if (!hasRetryOptions) {
            context.report({
              node,
              messageId: "missingRetryOptions",
              data: {
                name: calleeName,
              },
            });
          }
        }
      },
    };
  },
};

export default {
  rules: {
    "structured-logging": structuredLogging,
    "require-retry-options": requireRetryOptions,
  },
  configs: {},
};
