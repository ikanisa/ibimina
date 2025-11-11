import fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const APP_DIR = path.resolve("apps/pwa/staff-admin/app");
const COMPONENTS_DIR = path.resolve("apps/pwa/staff-admin/components");
const OUTPUT_DIR = path.resolve("analysis/ui-inventory");

const ROUTE_FILE_PATTERN =
  /^(page|layout|template|loading|error|not-found|default|route|head)\.(t|j)sx?$/;
const COMPONENT_FILE_PATTERN = /\.(t|j)sx?$/;

const IA_TARGETS: { label: string; keywords: string[] }[] = [
  { label: "Members", keywords: ["member", "client", "customer"] },
  { label: "Accounts", keywords: ["account", "wallet", "savings"] },
  { label: "Loans", keywords: ["loan", "credit"] },
  { label: "Transactions", keywords: ["transaction", "payment", "transfer"] },
  { label: "Operations", keywords: ["operations", "audit", "reconciliation"] },
  { label: "Settings", keywords: ["settings", "configuration", "preferences"] },
  { label: "Reports", keywords: ["report", "analytics", "dashboard", "insight"] },
  { label: "Staff", keywords: ["staff", "team", "user"] },
];

type RouteEntry = {
  category: "route";
  routeId: string;
  routePath: string;
  fileType: string;
  file: string;
  groups: string[];
  exports: string[];
  importedSymbols: string[];
  heuristics: string[];
  usesClient: boolean;
  iaGuess: string;
};

type ComponentEntry = {
  category: "component";
  componentId: string;
  file: string;
  exports: string[];
  importedSymbols: string[];
  heuristics: string[];
  usesClient: boolean;
};

type InventoryEntry = RouteEntry | ComponentEntry;

type InventorySummary = {
  generatedAt: string;
  routeCount: number;
  componentCount: number;
  clientRouteCount: number;
  clientComponentCount: number;
  iaCoverage: Record<string, { routes: string[] }>;
  unmappedRoutes: string[];
};

async function ensureDirectory(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function walk(dir: string, callback: (filePath: string) => Promise<void> | void) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      await walk(path.join(dir, entry.name), callback);
    } else {
      await callback(path.join(dir, entry.name));
    }
  }
}

function isWithinDirectory(filePath: string, parent: string) {
  const relative = path.relative(parent, filePath);
  return !!relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function isRouteFile(filePath: string) {
  if (!isWithinDirectory(filePath, APP_DIR)) return false;
  const fileName = path.basename(filePath);
  if (!ROUTE_FILE_PATTERN.test(fileName)) return false;
  const rel = path.relative(APP_DIR, filePath);
  if (rel.split(path.sep).includes("api")) return false;
  if (rel.split(path.sep).includes("actions")) return false;
  return true;
}

function isComponentFile(filePath: string) {
  if (!isWithinDirectory(filePath, COMPONENTS_DIR)) return false;
  if (!COMPONENT_FILE_PATTERN.test(filePath)) return false;
  if (filePath.endsWith(".d.ts")) return false;
  return true;
}

function createSourceFile(filePath: string, content: string) {
  const scriptKind = filePath.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : filePath.endsWith(".jsx")
      ? ts.ScriptKind.JSX
      : ts.ScriptKind.TS;
  return ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, scriptKind);
}

function extractExports(sourceFile: ts.SourceFile, content: string) {
  const exportNames = new Set<string>();
  sourceFile.forEachChild((node) => {
    if (
      (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      const name = node.name?.text ?? "default";
      exportNames.add(name);
    }
    if (
      ts.isVariableStatement(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          exportNames.add(declaration.name.text);
        }
      }
    }
    if (ts.isExportAssignment(node)) {
      if (ts.isIdentifier(node.expression)) {
        exportNames.add(node.expression.text);
      } else if (ts.isFunctionExpression(node.expression) || ts.isArrowFunction(node.expression)) {
        exportNames.add("default");
      }
    }
  });

  if (content.includes("export const metadata")) {
    exportNames.add("metadata");
  }

  return Array.from(exportNames);
}

function extractImports(sourceFile: ts.SourceFile) {
  const imports: string[] = [];
  sourceFile.forEachChild((node) => {
    if (ts.isImportDeclaration(node) && node.importClause) {
      const moduleText = node.moduleSpecifier.getText(sourceFile).replace(/['"]/g, "");
      const namedBindings = node.importClause.namedBindings;
      const defaultImport = node.importClause.name?.text;
      if (defaultImport) {
        imports.push(`${defaultImport} ← ${moduleText}`);
      }
      if (namedBindings && ts.isNamedImports(namedBindings)) {
        for (const element of namedBindings.elements) {
          const symbol = element.name.text;
          imports.push(`${symbol} ← ${moduleText}`);
        }
      }
    }
  });
  return imports;
}

function detectHeuristics(content: string, imports: string[]) {
  const heuristics: string[] = [];
  if (/['\"]use client['\"]/.test(content.split("\n").slice(0, 5).join("\n"))) {
    heuristics.push("Client component");
  }
  if (/['\"]use server['\"]/.test(content)) {
    heuristics.push("Server action reference");
  }
  if (/TODO|FIXME/i.test(content)) {
    heuristics.push("Contains TODO or FIXME");
  }
  if (/<form[\s>]/i.test(content)) {
    heuristics.push("Form interaction");
  }
  if (/useTranslations\(/.test(content)) {
    heuristics.push("i18n hook (useTranslations)");
  }
  if (/Suspense\b/.test(content)) {
    heuristics.push("Suspense boundary");
  }
  if (/useQuery\(/.test(content) || /trpc\./.test(content)) {
    heuristics.push("Data fetching hook");
  }
  if (imports.some((entry) => entry.includes("chart") || entry.includes("Chart"))) {
    heuristics.push("Charts or data viz");
  }
  if (/dialog/i.test(content) && /<Dialog/i.test(content)) {
    heuristics.push("Dialog usage");
  }
  return heuristics;
}

function detectClientDirective(content: string) {
  const trimmed = content.trimStart();
  const directiveMatch = trimmed.match(/^(?:['\"])use client(?:['\"])(?:;)?/);
  return Boolean(directiveMatch);
}

function normalizeSegment(segment: string) {
  if (segment.startsWith("(") && segment.endsWith(")")) {
    return { path: "", group: segment.slice(1, -1) };
  }
  if (/^\[\.\.\.(.+)\]$/.test(segment)) {
    const [, name] = segment.match(/^\[\.\.\.(.+)\]$/)!;
    return { path: `*${name}`, group: null };
  }
  if (/^\[\[\.\.\.(.+)\]\]$/.test(segment)) {
    const [, name] = segment.match(/^\[\[\.\.\.(.+)\]\]$/)!;
    return { path: `*${name}?`, group: null };
  }
  if (/^\[(.+)\]$/.test(segment)) {
    const [, name] = segment.match(/^\[(.+)\]$/)!;
    return { path: `:${name}`, group: null };
  }
  return { path: segment, group: null };
}

function deriveRoutePath(filePath: string) {
  const rel = path.relative(APP_DIR, filePath);
  const parts = rel.split(path.sep);
  const fileName = parts.pop() ?? "";
  const dirSegments = parts;
  const pathSegments: string[] = [];
  const groups: string[] = [];

  for (const segment of dirSegments) {
    if (segment === "") continue;
    const normalized = normalizeSegment(segment);
    if (normalized.group) {
      groups.push(normalized.group);
    }
    if (normalized.path) {
      pathSegments.push(normalized.path);
    }
  }

  let routePath = "/" + pathSegments.filter(Boolean).join("/");
  if (routePath === "//") routePath = "/";
  if (routePath === "/" && pathSegments.length === 0) routePath = "/";

  const routeId = [...dirSegments, fileName].join("/");

  const fileBase = path.basename(fileName, path.extname(fileName));
  if (fileBase === "page" || fileBase === "default") {
    // no-op
  } else if (fileBase === "layout") {
    routePath = `${routePath} (layout)`;
  } else if (fileBase === "loading") {
    routePath = `${routePath} (loading)`;
  } else if (fileBase === "error") {
    routePath = `${routePath} (error)`;
  } else if (fileBase === "template") {
    routePath = `${routePath} (template)`;
  } else if (fileBase === "not-found") {
    routePath = `${routePath} (not-found)`;
  } else if (fileBase === "head") {
    routePath = `${routePath} (head)`;
  }

  return { routePath: routePath.replace(/\/+$/, "") || "/", groups, routeId };
}

function guessIa(routePath: string) {
  const normalized = routePath.toLowerCase();
  for (const target of IA_TARGETS) {
    if (target.keywords.some((keyword) => normalized.includes(keyword))) {
      return target.label;
    }
  }
  return "Unmapped";
}

function analyseFile(filePath: string, category: "route" | "component"): InventoryEntry | null {
  const content = fsSyncRead(filePath);
  const sourceFile = createSourceFile(filePath, content);
  const exports = extractExports(sourceFile, content);
  const imports = extractImports(sourceFile);
  const heuristics = detectHeuristics(content, imports);
  const usesClient = detectClientDirective(content);

  if (category === "route") {
    const { routePath, groups, routeId } = deriveRoutePath(filePath);
    const fileType = path.basename(filePath).split(".")[0];
    const iaGuess = guessIa(routePath);
    return {
      category: "route",
      routeId,
      routePath,
      fileType,
      file: path.relative(process.cwd(), filePath),
      groups,
      exports: exports.filter(Boolean),
      importedSymbols: imports,
      heuristics,
      usesClient,
      iaGuess,
    };
  }

  const componentId = path.relative(COMPONENTS_DIR, filePath);
  return {
    category: "component",
    componentId,
    file: path.relative(process.cwd(), filePath),
    exports: exports.filter(Boolean),
    importedSymbols: imports,
    heuristics,
    usesClient,
  };
}

function fsSyncRead(filePath: string) {
  return readFileSync(filePath, "utf8");
}

function toCsv(entries: InventoryEntry[]) {
  const headers = [
    "category",
    "identifier",
    "routePath",
    "fileType",
    "file",
    "groups",
    "exports",
    "imports",
    "heuristics",
    "usesClient",
    "iaGuess",
  ];

  const rows = entries.map((entry) => {
    if (entry.category === "route") {
      return [
        "route",
        entry.routeId,
        entry.routePath,
        entry.fileType,
        entry.file,
        entry.groups.join("|"),
        entry.exports.join("|"),
        entry.importedSymbols.join("|"),
        entry.heuristics.join("|"),
        entry.usesClient ? "yes" : "no",
        entry.iaGuess,
      ];
    }
    return [
      "component",
      entry.componentId,
      "",
      "",
      entry.file,
      "",
      entry.exports.join("|"),
      entry.importedSymbols.join("|"),
      entry.heuristics.join("|"),
      entry.usesClient ? "yes" : "no",
      "",
    ];
  });

  return [headers.join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n");
}

function csvEscape(value: string | undefined) {
  const normalised = value ?? "";
  const safe = normalised.replace(/"/g, '""');
  if (safe.includes(",") || safe.includes("\n") || safe.includes('"')) {
    return `"${safe}"`;
  }
  return safe;
}

async function buildInventory(): Promise<{ entries: InventoryEntry[]; summary: InventorySummary }> {
  const entries: InventoryEntry[] = [];

  await walk(APP_DIR, async (filePath) => {
    if (isRouteFile(filePath)) {
      const analysed = analyseFile(filePath, "route");
      if (analysed) {
        entries.push(analysed);
      }
    }
  });

  try {
    await fs.access(COMPONENTS_DIR);
    await walk(COMPONENTS_DIR, async (filePath) => {
      if (isComponentFile(filePath)) {
        const analysed = analyseFile(filePath, "component");
        if (analysed) {
          entries.push(analysed);
        }
      }
    });
  } catch (error) {
    // components directory optional
  }

  const routes = entries.filter((entry): entry is RouteEntry => entry.category === "route");
  const components = entries.filter(
    (entry): entry is ComponentEntry => entry.category === "component"
  );

  const iaCoverage: InventorySummary["iaCoverage"] = {};
  for (const target of IA_TARGETS) {
    iaCoverage[target.label] = { routes: [] };
  }
  iaCoverage["Unmapped"] = { routes: [] };

  for (const route of routes) {
    if (!iaCoverage[route.iaGuess]) {
      iaCoverage[route.iaGuess] = { routes: [] };
    }
    iaCoverage[route.iaGuess].routes.push(route.routePath);
  }

  const summary: InventorySummary = {
    generatedAt: new Date().toISOString(),
    routeCount: routes.length,
    componentCount: components.length,
    clientRouteCount: routes.filter((route) => route.usesClient).length,
    clientComponentCount: components.filter((component) => component.usesClient).length,
    iaCoverage,
    unmappedRoutes: iaCoverage["Unmapped"]?.routes ?? [],
  };

  return { entries, summary };
}

async function writeOutputs(entries: InventoryEntry[], summary: InventorySummary) {
  await ensureDirectory(OUTPUT_DIR);
  const jsonPath = path.join(OUTPUT_DIR, "ui-inventory.json");
  const csvPath = path.join(OUTPUT_DIR, "ui-inventory.csv");
  await fs.writeFile(jsonPath, JSON.stringify({ entries, summary }, null, 2));
  await fs.writeFile(csvPath, toCsv(entries));
  console.log(
    `UI inventory written to ${path.relative(process.cwd(), jsonPath)} and ${path.relative(process.cwd(), csvPath)}`
  );
  console.log(
    `Routes analysed: ${summary.routeCount}, Components analysed: ${summary.componentCount}`
  );
}

async function main() {
  const { entries, summary } = await buildInventory();
  await writeOutputs(entries, summary);
}

main().catch((error) => {
  console.error("Failed to build UI inventory");
  console.error(error);
  process.exitCode = 1;
});
