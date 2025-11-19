const TEXT_KEYS = new Set([
  "title",
  "description",
  "label",
  "heading",
  "message",
  "empty",
  "cta",
  "subtitle",
  "copy",
]);

const ALLOWED_PROPERTY_NAMES = new Set([
  "href",
  "className",
  "icon",
  "id",
  "type",
  "role",
  "name",
  "value",
  "locale",
]);

const TECHNICAL_PATTERN = /^[\w@/:.+-]+$/;

function isPageFile(filename = "") {
  return /app[\\/].*page\.(t|j)sx?$/.test(filename);
}

function isDirectiveLiteral(node) {
  return (
    node.parent?.type === "ExpressionStatement" &&
    node.parent.expression === node &&
    typeof node.value === "string" &&
    node.directive
  );
}

function isImportExportLiteral(node) {
  return (
    node.parent?.type === "ImportDeclaration" ||
    node.parent?.type === "ExportAllDeclaration" ||
    node.parent?.type === "ExportNamedDeclaration"
  );
}

function propertyName(propertyNode) {
  if (propertyNode.key.type === "Identifier") return propertyNode.key.name;
  if (propertyNode.key.type === "Literal" && typeof propertyNode.key.value === "string") {
    return propertyNode.key.value;
  }
  return undefined;
}

function shouldReportLiteral(node) {
  if (typeof node.value !== "string") return false;
  if (isDirectiveLiteral(node)) return false;
  if (isImportExportLiteral(node)) return false;

  if (node.parent?.type === "JSXAttribute" && ALLOWED_PROPERTY_NAMES.has(node.parent.name.name)) {
    return false;
  }

  if (node.parent?.type === "Property") {
    const keyName = propertyName(node.parent);
    if (keyName && ALLOWED_PROPERTY_NAMES.has(keyName)) {
      return false;
    }
    if (keyName && TEXT_KEYS.has(keyName)) {
      return true;
    }
  }

  if (node.parent?.type === "JSXText") {
    return true;
  }

  if (node.parent?.type === "JSXExpressionContainer") {
    return true;
  }

  if (node.value.trim().length === 0) return false;
  if (TECHNICAL_PATTERN.test(node.value)) return false;

  if (node.value.includes(" ")) {
    return true;
  }

  return false;
}

const noInlinePageLiterals = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow inline literal strings in page components",
      recommended: false,
    },
    messages: {
      inlineLiteral: "Move page-facing copy to @ibimina/locales or a shared messages file.",
    },
  },
  create(context) {
    if (!isPageFile(context.getFilename())) {
      return {};
    }

    return {
      Literal(node) {
        if (shouldReportLiteral(node)) {
          context.report({ node, messageId: "inlineLiteral" });
        }
      },
      TemplateLiteral(node) {
        if (node.quasis.length === 1 && node.expressions.length === 0) {
          const literalNode = {
            ...node,
            value: node.quasis[0].value.cooked ?? "",
          };
          if (shouldReportLiteral(literalNode)) {
            context.report({ node, messageId: "inlineLiteral" });
          }
        }
      },
    };
  },
};

export default noInlinePageLiterals;
