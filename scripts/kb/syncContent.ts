import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

interface BaseSource {
  id: string;
  name: string;
  owner: string;
  outputSubdir?: string;
  enabled?: boolean;
  updateCadence?: string;
}

interface CmsSource extends BaseSource {
  type: "cms";
  endpoint: string;
  tokenEnv?: string;
  locale?: string;
}

interface DriveSource extends BaseSource {
  type: "drive";
  path: string;
  includeExtensions?: string[];
}

type PartnerSource = CmsSource | DriveSource;

interface ConfigFile {
  sources: PartnerSource[];
}

interface CmsArticle {
  slug: string;
  title?: string;
  content: string;
  locale?: string;
  updatedAt?: string;
  format?: "markdown" | "html" | "plaintext";
}

interface OutputBundle {
  source: {
    id: string;
    name: string;
    owner: string;
    type: PartnerSource["type"];
    fetchedAt: string;
    updateCadence?: string;
    upstream?: {
      endpoint?: string;
      locale?: string;
    };
  };
  articles: CmsArticle[];
}

interface ManifestEntry {
  id: string;
  name: string;
  owner: string;
  type: PartnerSource["type"];
  fetchedAt: string;
  articleCount: number;
  outputPath: string;
  updateCadence?: string;
}

const DEFAULT_EXTENSIONS = [".md", ".mdx", ".markdown", ".json", ".html"];

async function readConfig(): Promise<PartnerSource[]> {
  const candidateFiles = [
    path.resolve(__dirname, "sources.config.json"),
    path.resolve(__dirname, "sources.config.example.json"),
  ];

  for (const filePath of candidateFiles) {
    try {
      const content = await readFile(filePath, "utf8");
      const parsed = JSON.parse(content) as ConfigFile;
      if (!parsed?.sources?.length) {
        continue;
      }
      return parsed.sources;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.warn(`Failed to parse config ${filePath}:`, error);
      }
    }
  }

  console.warn("No knowledge base sources configured.");
  return [];
}

async function ensureDir(dirPath: string) {
  await mkdir(dirPath, { recursive: true });
}

async function loadCmsSource(source: CmsSource): Promise<OutputBundle | null> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (source.tokenEnv) {
    const token = process.env[source.tokenEnv];
    if (!token) {
      console.warn(`Skipping CMS source "${source.name}" – missing token in ${source.tokenEnv}.`);
      return null;
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(source.endpoint, { headers });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch CMS source ${source.name} (${source.endpoint}): ${response.status} ${response.statusText}`
    );
  }

  const payload = (await response.json()) as { articles?: CmsArticle[] } | CmsArticle[];
  const articles = Array.isArray(payload) ? payload : payload.articles;

  if (!articles?.length) {
    console.warn(`CMS source ${source.name} returned no articles.`);
    return {
      source: makeSourceMeta(source),
      articles: [],
    };
  }

  const normalised = articles.map((article) => ({
    ...article,
    locale: article.locale ?? source.locale,
    format: article.format ?? "markdown",
  }));

  return {
    source: makeSourceMeta(source),
    articles: normalised,
  };
}

async function loadDriveSource(source: DriveSource): Promise<OutputBundle | null> {
  const resolvedPath = resolveLocalPath(source.path);
  try {
    const stats = await stat(resolvedPath);
    if (!stats.isDirectory()) {
      console.warn(
        `Skipping drive source ${source.name} – path is not a directory: ${resolvedPath}`
      );
      return null;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.warn(`Skipping drive source ${source.name} – path not found: ${resolvedPath}`);
      return null;
    }
    throw error;
  }

  const includeExtensions = source.includeExtensions ?? DEFAULT_EXTENSIONS;
  const files = await collectFiles(resolvedPath);
  const filtered = files.filter((file) => includeExtensions.includes(path.extname(file)));

  const articles: CmsArticle[] = [];
  for (const filePath of filtered) {
    const absolutePath = path.resolve(resolvedPath, filePath);
    const content = await readFile(absolutePath, "utf8");
    const slug = createSlug(filePath);
    const title = extractTitle(content);
    articles.push({
      slug,
      title,
      content,
      format: inferFormatFromExtension(filePath),
    });
  }

  return {
    source: makeSourceMeta(source),
    articles,
  };
}

function resolveLocalPath(rawPath: string): string {
  if (rawPath.startsWith("drive://")) {
    const driveMount = process.env.MOMO_DRIVE_PATH;
    if (!driveMount) {
      return rawPath;
    }
    return rawPath.replace("drive://", `${driveMount}/`);
  }

  if (rawPath.startsWith("~/")) {
    return path.resolve(process.env.HOME ?? "", rawPath.slice(2));
  }

  if (path.isAbsolute(rawPath)) {
    return rawPath;
  }

  return path.resolve(repoRoot(), rawPath);
}

function repoRoot(): string {
  return path.resolve(__dirname, "..", "..");
}

async function collectFiles(dir: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(path.resolve(dir, prefix), { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }
    const nextPath = path.join(prefix, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectFiles(dir, nextPath);
      files.push(...nested);
    } else {
      files.push(nextPath);
    }
  }

  return files;
}

function createSlug(filePath: string): string {
  return filePath
    .replace(/\\/g, "/")
    .replace(/\.[^.]+$/, "")
    .split("/")
    .map((segment) =>
      segment
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    )
    .filter(Boolean)
    .join("-");
}

function extractTitle(content: string): string | undefined {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : undefined;
}

function inferFormatFromExtension(filePath: string): CmsArticle["format"] {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".html") {
    return "html";
  }
  if (extension === ".json") {
    return "plaintext";
  }
  return "markdown";
}

function makeSourceMeta(source: PartnerSource): OutputBundle["source"] {
  return {
    id: source.id,
    name: source.name,
    owner: source.owner,
    type: source.type,
    fetchedAt: new Date().toISOString(),
    updateCadence: source.updateCadence,
    upstream:
      source.type === "cms"
        ? {
            endpoint: source.endpoint,
            locale: source.locale,
          }
        : undefined,
  };
}

async function writeBundle(
  bundle: OutputBundle,
  source: PartnerSource,
  outputDir: string
): Promise<string> {
  const targetDir = source.outputSubdir ? path.resolve(outputDir, source.outputSubdir) : outputDir;
  await ensureDir(targetDir);
  const targetFile = path.resolve(targetDir, `${source.id}.json`);
  await writeFile(targetFile, JSON.stringify(bundle, null, 2), "utf8");
  console.log(
    `✔ Wrote ${bundle.articles.length} articles for ${source.name} → ${path.relative(repoRoot(), targetFile)}`
  );
  return targetFile;
}

async function run() {
  const sources = await readConfig();
  if (!sources.length) {
    return;
  }

  const outputDir = path.resolve(repoRoot(), "apps/website/public/help");
  await ensureDir(outputDir);

  const manifestEntries: ManifestEntry[] = [];

  for (const source of sources) {
    if (source.enabled === false) {
      console.log(`⏭  Skipping disabled source ${source.name}`);
      continue;
    }

    try {
      const bundle =
        source.type === "cms" ? await loadCmsSource(source) : await loadDriveSource(source);
      if (!bundle) {
        continue;
      }
      const outputFile = await writeBundle(bundle, source, outputDir);
      manifestEntries.push({
        id: bundle.source.id,
        name: bundle.source.name,
        owner: bundle.source.owner,
        type: bundle.source.type,
        fetchedAt: bundle.source.fetchedAt,
        articleCount: bundle.articles.length,
        outputPath: path.relative(repoRoot(), outputFile),
        updateCadence: bundle.source.updateCadence,
      });
    } catch (error) {
      console.error(`✖ Failed to process source ${source.name}:`, error);
    }
  }

  if (manifestEntries.length) {
    const manifestPath = path.resolve(outputDir, "manifest.json");
    const manifest = {
      generatedAt: new Date().toISOString(),
      sources: manifestEntries,
    };
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
    console.log(
      `✔ Wrote manifest for ${manifestEntries.length} sources → ${path.relative(repoRoot(), manifestPath)}`
    );
  }
}

run().catch((error) => {
  console.error("Unexpected error while syncing knowledge base content:", error);
  process.exit(1);
});
