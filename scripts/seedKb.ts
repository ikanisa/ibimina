import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

interface FrontMatter {
  title: string;
  language_code: string;
  tags?: string[];
  policy_tag?: string;
  scope: "global" | "org";
  org_id?: string;
  org_ids?: string[];
}

interface SeedSource {
  filePath: string;
  metadata: FrontMatter;
  content: string;
}

type TargetTable = "global" | "org";

interface PreparedRecord {
  table: TargetTable;
  title: string;
  content: string;
  tags: string[];
  policy_tag?: string;
  language_code: string;
  org_id?: string;
  embedding?: number[];
  sourceFile: string;
}

interface CliOptions {
  dryRun: boolean;
  filterOrg?: string;
  filterLanguage?: string;
  scope?: TargetTable;
  batchSize: number;
  maxRetries: number;
}

const KB_ROOT = path.resolve("supabase/seed/kb");
const DEFAULT_BATCH_SIZE = Number.parseInt(process.env.KB_EMBED_BATCH_SIZE ?? "8", 10);
const DEFAULT_MAX_RETRIES = Number.parseInt(process.env.KB_EMBED_MAX_RETRIES ?? "3", 10);

function parseArgs(argv: string[]): CliOptions {
  let dryRun = false;
  let filterOrg: string | undefined;
  let filterLanguage: string | undefined;
  let scope: TargetTable | undefined;
  let batchSize = DEFAULT_BATCH_SIZE;
  let maxRetries = DEFAULT_MAX_RETRIES;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--dry-run":
        dryRun = true;
        break;
      case "--org": {
        const value = argv[i + 1];
        if (!value) throw new Error("--org requires a value");
        filterOrg = value;
        i += 1;
        break;
      }
      case "--language": {
        const value = argv[i + 1];
        if (!value) throw new Error("--language requires a value");
        filterLanguage = value;
        i += 1;
        break;
      }
      case "--scope": {
        const value = argv[i + 1] as TargetTable | undefined;
        if (!value || (value !== "global" && value !== "org")) {
          throw new Error("--scope must be 'global' or 'org'");
        }
        scope = value;
        i += 1;
        break;
      }
      case "--batch-size": {
        const value = argv[i + 1];
        if (!value) throw new Error("--batch-size requires a value");
        batchSize = Number.parseInt(value, 10);
        if (!Number.isFinite(batchSize) || batchSize <= 0) {
          throw new Error("--batch-size must be a positive integer");
        }
        i += 1;
        break;
      }
      case "--max-retries": {
        const value = argv[i + 1];
        if (!value) throw new Error("--max-retries requires a value");
        maxRetries = Number.parseInt(value, 10);
        if (!Number.isFinite(maxRetries) || maxRetries <= 0) {
          throw new Error("--max-retries must be a positive integer");
        }
        i += 1;
        break;
      }
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return { dryRun, filterOrg, filterLanguage, scope, batchSize, maxRetries };
}

async function collectMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const nested = await collectMarkdownFiles(path.join(dir, entry.name));
      files.push(...nested);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(path.join(dir, entry.name));
    }
  }

  return files;
}

function parseFrontMatter(raw: string, filePath: string): SeedSource {
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith("---")) {
    throw new Error(`Missing front matter in ${filePath}`);
  }

  const match = trimmed.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) {
    throw new Error(`Invalid front matter block in ${filePath}`);
  }

  const [, metaRaw] = match;
  let metadata: FrontMatter;
  try {
    metadata = JSON.parse(metaRaw);
  } catch (error) {
    throw new Error(`Failed to parse metadata JSON in ${filePath}: ${(error as Error).message}`);
  }

  if (!metadata.title) {
    throw new Error(`Missing title in metadata for ${filePath}`);
  }

  if (!metadata.language_code) {
    throw new Error(`Missing language_code in metadata for ${filePath}`);
  }

  if (metadata.scope !== "global" && metadata.scope !== "org") {
    throw new Error(`Invalid scope in metadata for ${filePath}. Expected 'global' or 'org'.`);
  }

  const content = trimmed.slice(match[0].length).trim();
  if (!content) {
    throw new Error(`File ${filePath} has no content after front matter`);
  }

  return {
    filePath,
    metadata,
    content,
  };
}

async function loadSeedSources(): Promise<SeedSource[]> {
  const files = await collectMarkdownFiles(KB_ROOT);
  const sources: SeedSource[] = [];

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, "utf8");
    sources.push(parseFrontMatter(raw, filePath));
  }

  return sources;
}

function expandRecords(sources: SeedSource[]): PreparedRecord[] {
  const records: PreparedRecord[] = [];

  for (const source of sources) {
    const { metadata, content, filePath } = source;
    const baseRecord = {
      title: metadata.title,
      content,
      tags: metadata.tags ?? [],
      policy_tag: metadata.policy_tag,
      language_code: metadata.language_code,
      sourceFile: filePath,
    } satisfies Omit<PreparedRecord, "table" | "org_id">;

    if (metadata.scope === "global") {
      records.push({
        ...baseRecord,
        table: "global",
        tags: baseRecord.tags,
      });
    } else {
      const orgIds = metadata.org_ids ?? (metadata.org_id ? [metadata.org_id] : []);
      if (orgIds.length === 0) {
        throw new Error(`Org-scoped article ${filePath} is missing org_id or org_ids`);
      }

      for (const orgId of orgIds) {
        records.push({
          ...baseRecord,
          table: "org",
          org_id: orgId,
          tags: baseRecord.tags,
        });
      }
    }
  }

  return records;
}

function filterRecords(records: PreparedRecord[], options: CliOptions): PreparedRecord[] {
  return records.filter((record) => {
    if (options.scope && record.table !== options.scope) {
      return false;
    }

    if (options.filterLanguage && record.language_code !== options.filterLanguage) {
      return false;
    }

    if (options.filterOrg && record.table === "org" && record.org_id !== options.filterOrg) {
      return false;
    }

    if (options.filterOrg && record.table === "global") {
      return false;
    }

    return true;
  });
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function embedRecords(
  records: PreparedRecord[],
  client: OpenAI,
  batchSize: number,
  maxRetries: number
) {
  const batches = chunk(records, batchSize);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
    const batch = batches[batchIndex];
    const inputs = batch.map((record) => `${record.title}\n\n${record.content}`);

    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      attempt += 1;
      try {
        const response = await client.embeddings.create({
          model: "text-embedding-3-large",
          input: inputs,
        });

        response.data.forEach((item, index) => {
          batch[index].embedding = item.embedding as number[];
        });

        console.log(
          `Embedded batch ${batchIndex + 1}/${batches.length} (${batch.length} records) on attempt ${attempt}.`
        );
        break;
      } catch (error) {
        if (attempt >= maxRetries) {
          throw new Error(
            `Embedding batch ${batchIndex + 1} failed after ${attempt} attempts: ${(error as Error).message}`
          );
        }

        const backoffMs = Math.min(1000 * 2 ** (attempt - 1), 15_000);
        console.warn(
          `Embedding batch ${batchIndex + 1} failed (attempt ${attempt}): ${(error as Error).message}. Retrying in ${backoffMs}ms...`
        );
        await sleep(backoffMs);
      }
    }
  }
}

async function upsertRecords(
  records: PreparedRecord[],
  supabaseUrl: string | undefined,
  supabaseKey: string | undefined,
  dryRun: boolean
) {
  if (records.some((record) => !record.embedding)) {
    throw new Error("Cannot upsert records before embeddings are generated.");
  }

  const globalRecords = records.filter((record) => record.table === "global");
  const orgRecords = records.filter((record) => record.table === "org");

  if (dryRun) {
    console.log("Dry run: skipping Supabase writes");
    return;
  }

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when not running with --dry-run"
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
    global: { headers: { "X-Client-Info": "kb-seed-script" } },
  });

  if (globalRecords.length > 0) {
    const { error } = await supabase.from("global_kb").upsert(
      globalRecords.map((record) => ({
        title: record.title,
        content: record.content,
        tags: record.tags,
        policy_tag: record.policy_tag ?? null,
        language_code: record.language_code,
        embedding: record.embedding,
      })),
      { onConflict: "language_code,title" }
    );

    if (error) {
      throw new Error(`Failed to upsert global records: ${error.message}`);
    }
  }

  if (orgRecords.length > 0) {
    const { error } = await supabase.from("org_kb").upsert(
      orgRecords.map((record) => ({
        title: record.title,
        content: record.content,
        tags: record.tags,
        policy_tag: record.policy_tag ?? null,
        language_code: record.language_code,
        embedding: record.embedding,
        org_id: record.org_id!,
      })),
      { onConflict: "org_id,language_code,title" }
    );

    if (error) {
      throw new Error(`Failed to upsert org records: ${error.message}`);
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  const openaiKey = process.env.OPENAI_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!openaiKey && !options.dryRun) {
    throw new Error("OPENAI_API_KEY is required unless running with --dry-run");
  }

  console.log("Loading knowledge base sources from", KB_ROOT);
  const sources = await loadSeedSources();
  console.log(`Discovered ${sources.length} source markdown files.`);

  const expanded = expandRecords(sources);
  const filtered = filterRecords(expanded, options);

  if (filtered.length === 0) {
    console.warn("No records match the provided filters.");
    return;
  }

  console.log(`Preparing ${filtered.length} records for embedding.`);

  if (options.dryRun && !openaiKey) {
    console.log("Dry run without OPENAI_API_KEY: generating placeholder embeddings.");
    for (const record of filtered) {
      record.embedding = Array(3072).fill(0);
    }
  } else {
    const openai = new OpenAI({ apiKey: openaiKey });
    await embedRecords(filtered, openai, options.batchSize, options.maxRetries);
  }

  await upsertRecords(filtered, supabaseUrl, supabaseKey, options.dryRun);

  const summary = filtered.reduce<Record<string, number>>((acc, record) => {
    const key = `${record.table}:${record.language_code}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  console.log("Seeded knowledge base articles:");
  for (const [key, count] of Object.entries(summary)) {
    console.log(`  - ${key}: ${count}`);
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
