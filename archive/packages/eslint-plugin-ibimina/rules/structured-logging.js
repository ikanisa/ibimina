const LOG_IDENTIFIER_NAMES = new Set([
  "logInfo",
  "logWarn",
  "logError",
  "logDebug",
  "logTrace",
  "captureMessage",
]);

const LOG_METHOD_NAMES = new Set(["info", "warn", "error", "debug", "trace", "log"]);

function unwrapCallee(node) {
  if (!node) {
    return null;
  }

  if (node.type === "ChainExpression") {
    return unwrapCallee(node.expression);
  }

  if (node.type === "CallExpression") {
    return unwrapCallee(node.callee);
  }

  if (node.type === "TSNonNullExpression" || node.type === "TSAsExpression") {
    return unwrapCallee(node.expression);
  }

  return node;
}

function isLoggingCall(callee) {
  const target = unwrapCallee(callee);
  if (!target) {
    return false;
  }

  if (target.type === "Identifier") {
    return LOG_IDENTIFIER_NAMES.has(target.name);
  }

  if (target.type === "MemberExpression" && !target.computed) {
    const property = target.property;
    if (property && property.type === "Identifier" && LOG_METHOD_NAMES.has(property.name)) {
      return true;
    }
  }

  return false;
}

export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "enforce structured logging by requiring an object payload for logging helpers",
      recommended: false,
    },
    messages: {
      requireObject: "Structured logs must include an object payload as metadata.",
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (!isLoggingCall(node.callee)) {
          return;
        }

        const hasObjectPayload = node.arguments.some(
          (argument) => argument.type === "ObjectExpression"
        );

        if (!hasObjectPayload) {
          context.report({ node, messageId: "requireObject" });
        }
      },
    };
  },
};
