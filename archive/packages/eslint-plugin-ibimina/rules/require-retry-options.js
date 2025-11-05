const DEFAULT_FUNCTIONS = ["invokeEdge"];

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

function getIdentifierName(node) {
  const target = unwrapCallee(node);
  if (!target) {
    return null;
  }

  if (target.type === "Identifier") {
    return target.name;
  }

  if (target.type === "MemberExpression" && !target.computed) {
    const property = target.property;
    if (property.type === "Identifier") {
      return property.name;
    }
  }

  return null;
}

function hasRetryProperty(argument) {
  if (!argument || argument.type !== "ObjectExpression") {
    return false;
  }

  return argument.properties.some((property) => {
    if (property.type !== "Property" || property.computed) {
      return false;
    }

    if (property.key.type === "Identifier" && property.key.name === "retry") {
      return true;
    }

    if (property.key.type === "Literal" && property.key.value === "retry") {
      return true;
    }

    return false;
  });
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "enforce retry/backoff options when invoking network helpers prone to transient failures",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          functions: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingRetry: "Calls to '{{name}}' must include a retry/backoff configuration object.",
    },
  },
  create(context) {
    const option = context.options[0] ?? {};
    const functionNames = new Set(option.functions ?? DEFAULT_FUNCTIONS);

    return {
      CallExpression(node) {
        const name = getIdentifierName(node.callee);
        if (!name || !functionNames.has(name)) {
          return;
        }

        if (!hasRetryProperty(node.arguments[1])) {
          context.report({ node, messageId: "missingRetry", data: { name } });
        }
      },
    };
  },
};
