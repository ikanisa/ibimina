#!/usr/bin/env node
import {
  EmbeddingIngestionPipeline,
  OpenAIEmbeddingProvider,
  SupabaseVectorStore,
} from "../index.js";

interface CliArgs {
  org?: string | null;
  documentIds?: string[];
  reason?: string;
  triggeredBy?: string | null;
}

function parseArgs(): CliArgs {
  const args: CliArgs = {};
  for (const raw of process.argv.slice(2)) {
    const [key, value] = raw.split("=");
    if (!key.startsWith("--")) {
      continue;
    }

    const normalized = key.slice(2);
    switch (normalized) {
      case "org":
        args.org = value ?? null;
        break;
      case "doc":
      case "document":
      case "documentId":
        args.documentIds = value
          ? value
              .split(",")
              .map((part) => part.trim())
              .filter(Boolean)
          : undefined;
        break;
      case "reason":
        args.reason = value ?? undefined;
        break;
      case "trigger":
      case "triggeredBy":
        args.triggeredBy = value ?? null;
        break;
      default:
        break;
    }
  }

  return args;
}

async function main() {
  const args = parseArgs();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY must be set to run the reindex pipeline");
  }

  const store = SupabaseVectorStore.fromEnv();
  const provider = new OpenAIEmbeddingProvider({ apiKey });
  const pipeline = new EmbeddingIngestionPipeline(store, provider);

  const summary = await pipeline.reindex({
    orgId: args.org ?? undefined,
    documentIds: args.documentIds,
    reason: args.reason ?? "manual_reindex",
    triggeredBy: args.triggeredBy ?? null,
  });

  console.log(
    `Reindexed ${summary.documentCount} documents and refreshed ${summary.totalChunks} chunks successfully.`
  );
}

main().catch((error) => {
  console.error("Reindex operation failed", error);
  process.exit(1);
});
