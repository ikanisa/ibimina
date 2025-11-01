import { randomUUID } from "node:crypto";
import type {
  DocumentFilter,
  IngestionJobInsert,
  IngestionJobRecord,
  IngestionJobUpdate,
  KeywordSearchOptions,
  MatchQueryOptions,
  MatchResult,
  ReindexEventInsert,
  StoredChunkRecord,
  VectorChunkRecord,
  VectorDocumentRecord,
  VectorDocumentUpsert,
  VectorStore,
  JobFilter,
} from "./types.js";

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i += 1) {
    const valueA = a[i];
    const valueB = b[i];
    dot += valueA * valueB;
    magA += valueA * valueA;
    magB += valueB * valueB;
  }

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export class InMemoryVectorStore implements VectorStore {
  private documents = new Map<string, VectorDocumentRecord>();
  private chunks = new Map<string, StoredChunkRecord>();
  private jobs = new Map<string, IngestionJobRecord>();
  private reindexEvents: ReindexEventInsert[] = [];

  async upsertDocument(document: VectorDocumentUpsert): Promise<VectorDocumentRecord> {
    const existing = Array.from(this.documents.values()).find(
      (doc) => doc.orgId === (document.orgId ?? null) && doc.checksum === document.checksum
    );

    const id = existing?.id ?? document.id ?? randomUUID();
    const record: VectorDocumentRecord = {
      id,
      orgId: document.orgId ?? null,
      title: document.title,
      sourceType: document.sourceType,
      sourceUri: document.sourceUri ?? null,
      checksum: document.checksum,
      metadata: { ...(document.metadata ?? {}) },
      tokenCount: document.tokenCount ?? null,
      createdBy: document.createdBy ?? null,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.documents.set(id, record);
    return record;
  }

  async replaceDocumentChunks(documentId: string, chunks: VectorChunkRecord[]): Promise<void> {
    for (const chunk of Array.from(this.chunks.values())) {
      if (chunk.documentId === documentId) {
        this.chunks.delete(chunk.id);
      }
    }

    chunks.forEach((chunk, index) => {
      const id = chunk.id ?? randomUUID();
      this.chunks.set(id, {
        id,
        documentId,
        chunkIndex: chunk.chunkIndex ?? index,
        content: chunk.content,
        embedding: [...chunk.embedding],
        tokenCount: chunk.tokenCount ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  }

  async getDocumentChunks(documentId: string): Promise<StoredChunkRecord[]> {
    return Array.from(this.chunks.values())
      .filter((chunk) => chunk.documentId === documentId)
      .sort((a, b) => a.chunkIndex - b.chunkIndex)
      .map((chunk) => ({ ...chunk, embedding: [...chunk.embedding] }));
  }

  async logIngestionJob(job: IngestionJobInsert): Promise<IngestionJobRecord> {
    const id = randomUUID();
    const record: IngestionJobRecord = {
      id,
      documentId: job.documentId ?? null,
      sourceType: job.sourceType,
      sourceUri: job.sourceUri ?? null,
      status: job.status ?? "processing",
      metrics: { ...(job.metrics ?? {}) },
      error: job.error ?? null,
      startedAt: new Date().toISOString(),
      finishedAt: null,
    };

    this.jobs.set(id, record);
    return record;
  }

  async updateIngestionJob(id: string, update: IngestionJobUpdate): Promise<void> {
    const record = this.jobs.get(id);
    if (!record) {
      return;
    }

    if (update.documentId !== undefined) {
      record.documentId = update.documentId;
    }

    if (update.status !== undefined) {
      record.status = update.status;
      if ((update.status === "completed" || update.status === "failed") && !record.finishedAt) {
        record.finishedAt = new Date().toISOString();
      }
    }

    if (update.metrics !== undefined) {
      record.metrics = { ...(update.metrics ?? {}) };
    }

    if (update.error !== undefined) {
      record.error = update.error ?? null;
    }

    this.jobs.set(id, { ...record });
  }

  async listDocuments(filter: DocumentFilter = {}): Promise<VectorDocumentRecord[]> {
    let docs = Array.from(this.documents.values());

    if (filter.orgId !== undefined) {
      docs = docs.filter((doc) => doc.orgId === filter.orgId);
    }

    if (filter.ids && filter.ids.length > 0) {
      docs = docs.filter((doc) => filter.ids?.includes(doc.id));
    }

    docs.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
    return docs;
  }

  async listJobs(filter: JobFilter = {}): Promise<IngestionJobRecord[]> {
    let jobs = Array.from(this.jobs.values());

    if (filter.since) {
      jobs = jobs.filter((job) => job.startedAt >= filter.since!);
    }

    jobs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));

    if (filter.limit) {
      jobs = jobs.slice(0, filter.limit);
    }

    return jobs.map((job) => ({ ...job, metrics: { ...job.metrics } }));
  }

  async logReindexEvent(event: ReindexEventInsert): Promise<void> {
    this.reindexEvents.push({ ...event });
  }

  async matchEmbedding(
    embedding: number[],
    options: MatchQueryOptions = {}
  ): Promise<MatchResult[]> {
    const matches: MatchResult[] = [];

    const allowedDocumentIds = new Set<string>();
    const documents = await this.listDocuments({ orgId: options.orgId ?? undefined });
    documents.forEach((doc) => allowedDocumentIds.add(doc.id));

    for (const chunk of this.chunks.values()) {
      if (!allowedDocumentIds.has(chunk.documentId)) {
        continue;
      }

      const similarity = cosineSimilarity(embedding, chunk.embedding);
      if (similarity >= (options.matchThreshold ?? 0.68)) {
        const doc = this.documents.get(chunk.documentId);
        if (!doc) {
          continue;
        }
        matches.push({
          documentId: doc.id,
          chunkId: chunk.id,
          content: chunk.content,
          similarity,
          title: doc.title,
          sourceType: doc.sourceType,
          sourceUri: doc.sourceUri,
          metadata: { ...doc.metadata },
        });
      }
    }

    matches.sort((a, b) => b.similarity - a.similarity);
    return matches.slice(0, options.matchCount ?? 5);
  }

  async keywordSearch(query: string, options: KeywordSearchOptions = {}): Promise<MatchResult[]> {
    const normalizedQuery = query.toLowerCase();
    const documents = await this.listDocuments({ orgId: options.orgId ?? undefined });
    const allowedDocumentIds = new Set(documents.map((doc) => doc.id));
    const tokens = normalizedQuery
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2);

    const matches = Array.from(this.chunks.values())
      .filter((chunk) => allowedDocumentIds.has(chunk.documentId))
      .map((chunk) => {
        const lower = chunk.content.toLowerCase();
        const doc = this.documents.get(chunk.documentId)!;

        let hits = 0;
        if (tokens.length > 0) {
          for (const token of tokens) {
            if (lower.includes(token)) {
              hits += 1;
            }
          }
        } else if (normalizedQuery.length > 0 && lower.includes(normalizedQuery)) {
          hits = 1;
        }

        if (hits === 0) {
          return null;
        }

        const coverage =
          tokens.length > 0
            ? hits / tokens.length
            : normalizedQuery.length / Math.max(lower.length, 1);
        const similarity = Math.min(0.99, 0.35 + coverage * 0.6);

        return {
          documentId: doc.id,
          chunkId: chunk.id,
          content: chunk.content,
          similarity,
          title: doc.title,
          sourceType: doc.sourceType,
          sourceUri: doc.sourceUri,
          metadata: { ...doc.metadata },
        };
      })
      .filter((match): match is NonNullable<typeof match> => Boolean(match))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, options.matchCount ?? 5);

    return matches;
  }
}
