import path from "path";
import noInlinePageLiterals from "./no-inline-page-literals.js";

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
        if (node.object.name === "console" && node.property.name === "log") {
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
          const hasRetryOptions = node.arguments.some((arg) => {
            return (
              arg.type === "ObjectExpression" &&
              arg.properties.some((prop) => prop.key && prop.key.name === "retry")
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

/**
 * Rule: no-private-imports
 * Prevents apps from importing private/internal module paths
 */
const APPS_PATH_REGEX = /[\\/]apps[\\/]/;
const PRIVATE_IMPORT_PATTERN = /(^\.{1,2}\/.*\binternal\b)|([@\w-]+\/internal\/)/;

const noPrivateImports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow importing internal/private paths from app code",
 * Rule: no-cross-surface-imports
 * Prevent imports between deployment surfaces that bypass shared packages.
 */
const noCrossSurfaceImports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow imports across app surfaces unless routed through packages/*",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      noPrivateImport:
        "Do not import internal modules ({{path}}); use the package public API instead.",
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename?.();
    const isAppFile = typeof filename === "string" && APPS_PATH_REGEX.test(filename);

    if (!isAppFile) {
      return {};
    }

    function checkSource(node) {
      const source = node.source?.value;
      if (typeof source !== "string") return;
      if (PRIVATE_IMPORT_PATTERN.test(source)) {
        context.report({
          node: node.source,
          messageId: "noPrivateImport",
          data: { path: source },
        });
      }
    }

    return {
      ImportDeclaration: checkSource,
      ExportNamedDeclaration: checkSource,
      ExportAllDeclaration: checkSource,
      noCrossSurface:
        "Avoid importing from '{{target}}' inside '{{source}}'. Move shared code into packages/* and import it from there.",
    },
    schema: [
      {
        type: "object",
        properties: {
          surfaces: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const repoRoot = context.getCwd ? context.getCwd() : process.cwd();
    const surfaceRoots = (
      context.options[0]?.surfaces || [
        "apps/admin",
        "apps/client",
        "apps/mobile",
        "apps/platform-api",
        "supabase",
      ]
    ).map((surface) => ({
      name: surface,
      path: path.join(repoRoot, surface),
    }));

    const isPackageImport = (value) =>
      value.startsWith("@ibimina/");

    const findSurfaceForPath = (filePath) =>
      surfaceRoots.find((surface) => filePath.startsWith(surface.path));

    const resolveImportPath = (importPath, fileDir) => {
      if (importPath.startsWith(".")) {
        return path.resolve(fileDir, importPath);
      }

      if (importPath.startsWith("/")) {
        return path.join(repoRoot, importPath.slice(1));
      }

      return null;
    };

    return {
      ImportDeclaration(node) {
        const filename = context.getFilename();
        if (!path.isAbsolute(filename)) return;

        const importerSurface = findSurfaceForPath(filename);
        if (!importerSurface) return;

        const importValue = node.source.value;
        if (typeof importValue !== "string" || isPackageImport(importValue)) return;

        const resolvedPath = resolveImportPath(importValue, path.dirname(filename));
        if (!resolvedPath) return;

        const targetSurface = findSurfaceForPath(resolvedPath);
        if (!targetSurface) return;

        if (targetSurface.name !== importerSurface.name) {
          context.report({
            node,
            messageId: "noCrossSurface",
            data: {
              target: targetSurface.name,
              source: importerSurface.name,
            },
          });
        }
      },
    };
  },
};

export default {
  rules: {
    "structured-logging": structuredLogging,
    "require-retry-options": requireRetryOptions,
    "no-private-imports": noPrivateImports,
    "no-cross-surface-imports": noCrossSurfaceImports,
    "no-inline-page-literals": noInlinePageLiterals,
  },
  configs: {},
};
