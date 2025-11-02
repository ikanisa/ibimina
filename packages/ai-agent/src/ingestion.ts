import { createHash } from "node:crypto";
import type {
  EmbeddingProvider,
  IngestionOutcome,
  KnowledgeDocumentInput,
  ReindexOptions,
  ReindexSummary,
  VectorChunkRecord,
  VectorStore,
} from "./types.js";

export interface IngestionPipelineOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  batchSize?: number;
}

interface ChunkedSection {
  content: string;
  tokenCount: number;
}

function estimateTokens(text: string): number {
  if (!text) {
    return 0;
  }

  return Math.max(1, Math.round(text.length / 4));
}

export class EmbeddingIngestionPipeline {
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;
  private readonly batchSize: number;

  constructor(
    private readonly store: VectorStore,
    private readonly embeddings: EmbeddingProvider,
    options: IngestionPipelineOptions = {}
  ) {
    this.chunkSize = options.chunkSize ?? 800;
    this.chunkOverlap = Math.min(options.chunkOverlap ?? 120, this.chunkSize - 1);
    this.batchSize = Math.max(1, options.batchSize ?? 16);
  }

  async ingest(documents: KnowledgeDocumentInput[]): Promise<IngestionOutcome[]> {
    const outcomes: IngestionOutcome[] = [];

    for (const document of documents) {
      const job = await this.store.logIngestionJob({
        sourceType: document.sourceType,
        sourceUri: document.sourceUri ?? null,
        status: "processing",
        metrics: {
          org_id: document.orgId ?? null,
        },
      });

      try {
        const sections = this.chunkDocument(document.content);
        const checksum = this.computeChecksum(document.content);
        const tokenCount = sections.reduce((total, item) => total + item.tokenCount, 0);

        const docRecord = await this.store.upsertDocument({
          orgId: document.orgId ?? null,
          title: document.title,
          sourceType: document.sourceType,
          sourceUri: document.sourceUri ?? null,
          checksum,
          metadata: document.metadata ?? {},
          tokenCount,
          createdBy: document.createdBy ?? null,
        });

        let chunkVectors: number[][] = [];
        if (sections.length > 0) {
          const contents = sections.map((section) => section.content);
          chunkVectors = await this.embedContents(contents);

          if (chunkVectors.length !== sections.length) {
            throw new Error(
              `Embedding provider returned ${chunkVectors.length} vectors for ${sections.length} chunks`
            );
          }
        }

        const chunkRecords: VectorChunkRecord[] = sections.map((section, index) => ({
          documentId: docRecord.id,
          chunkIndex: index,
          content: section.content,
          embedding: chunkVectors[index] ?? [],
          tokenCount: section.tokenCount,
        }));

        await this.store.replaceDocumentChunks(docRecord.id, chunkRecords);

        await this.store.updateIngestionJob(job.id, {
          documentId: docRecord.id,
          status: "completed",
          metrics: {
            ...job.metrics,
            chunk_count: sections.length,
            token_count: tokenCount,
            checksum,
          },
        });

        outcomes.push({
          documentId: docRecord.id,
          jobId: job.id,
          chunkCount: sections.length,
          tokenCount,
          checksum,
          status: "completed",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";

        await this.store.updateIngestionJob(job.id, {
          status: "failed",
          error: message,
        });

        outcomes.push({
          documentId: null,
          jobId: job.id,
          chunkCount: 0,
          tokenCount: 0,
          checksum: this.computeChecksum(document.content),
          status: "failed",
          error: message,
        });
      }
    }

    return outcomes;
  }

  async reindex(options: ReindexOptions = {}): Promise<ReindexSummary> {
    const documents = await this.store.listDocuments({
      orgId: options.orgId ?? undefined,
      ids: options.documentIds,
    });

    let totalChunks = 0;

    for (const document of documents) {
      const job = await this.store.logIngestionJob({
        documentId: document.id,
        sourceType: `reindex:${document.sourceType}`,
        sourceUri: document.sourceUri ?? null,
        status: "processing",
        metrics: {
          previous_checksum: document.checksum,
        },
      });

      try {
        const chunks = await this.store.getDocumentChunks(document.id);
        if (!chunks.length) {
          await this.store.updateIngestionJob(job.id, {
            status: "completed",
            metrics: { ...job.metrics, chunk_count: 0, token_count: 0 },
          });
          continue;
        }

        const vectors = await this.embedContents(chunks.map((chunk) => chunk.content));
        if (vectors.length !== chunks.length) {
          throw new Error("Embedding provider returned mismatched chunk counts during reindex");
        }

        const updatedChunks: VectorChunkRecord[] = chunks.map((chunk, index) => ({
          documentId: chunk.documentId,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          embedding: vectors[index],
          tokenCount: chunk.tokenCount ?? estimateTokens(chunk.content),
        }));

        await this.store.replaceDocumentChunks(document.id, updatedChunks);
        totalChunks += updatedChunks.length;

        await this.store.updateIngestionJob(job.id, {
          status: "completed",
          metrics: {
            ...job.metrics,
            chunk_count: updatedChunks.length,
            token_count: updatedChunks.reduce((sum, chunk) => sum + (chunk.tokenCount ?? 0), 0),
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        await this.store.updateIngestionJob(job.id, {
          status: "failed",
          error: message,
        });
      }
    }

    await this.store.logReindexEvent({
      triggeredBy: options.triggeredBy ?? null,
      reason: options.reason ?? "manual_reindex",
      targetOrg: options.orgId ?? null,
      jobCount: documents.length,
      chunkCount: totalChunks,
    });

    return {
      documentCount: documents.length,
      totalChunks,
    };
  }

  private computeChecksum(content: string): string {
    return createHash("sha256")
      .update(content ?? "")
      .digest("hex");
  }

  private chunkDocument(content: string): ChunkedSection[] {
    const normalized = content.replace(/\s+/g, " ").trim();

    if (!normalized) {
      return [];
    }

    const sections: ChunkedSection[] = [];
    let pointer = 0;

    while (pointer < normalized.length) {
      let end = Math.min(normalized.length, pointer + this.chunkSize);
      let slice = normalized.slice(pointer, end);

      if (end < normalized.length) {
        const lastSpace = slice.lastIndexOf(" ");
        if (lastSpace > this.chunkSize * 0.3) {
          slice = slice.slice(0, lastSpace);
          end = pointer + slice.length;
        }
      }

      slice = slice.trim();

      if (slice.length > 0) {
        sections.push({
          content: slice,
          tokenCount: estimateTokens(slice),
        });
      }

      if (end >= normalized.length) {
        break;
      }

      const nextPointer = end - this.chunkOverlap;
      pointer = nextPointer > pointer ? nextPointer : end;
    }

    return sections;
  }

  private async embedContents(contents: string[]): Promise<number[][]> {
    const vectors: number[][] = [];

    for (let index = 0; index < contents.length; index += this.batchSize) {
      const batch = contents.slice(index, index + this.batchSize);
      const batchVectors = await this.embeddings.embed(batch);
      vectors.push(...batchVectors);
    }

    return vectors;
  }
}
