import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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

function mapDocument(row: any): VectorDocumentRecord {
  return {
    id: row.id,
    orgId: row.org_id ?? null,
    title: row.title,
    sourceType: row.source_type,
    sourceUri: row.source_uri ?? null,
    checksum: row.checksum,
    metadata: row.metadata ?? {},
    tokenCount: row.token_count ?? null,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

function mapChunk(row: any): StoredChunkRecord {
  return {
    id: row.id,
    documentId: row.document_id,
    chunkIndex: row.chunk_index,
    content: row.content,
    embedding: Array.isArray(row.embedding) ? [...row.embedding] : [],
    tokenCount: row.token_count ?? null,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

function mapJob(row: any): IngestionJobRecord {
  return {
    id: row.id,
    documentId: row.document_id ?? null,
    sourceType: row.source_type,
    sourceUri: row.source_uri ?? null,
    status: row.status,
    metrics: row.metrics ?? {},
    error: row.error ?? null,
    startedAt: row.started_at ?? row.created_at ?? new Date().toISOString(),
    finishedAt: row.finished_at ?? null,
  };
}

function mapMatch(row: any): MatchResult {
  return {
    documentId: row.document_id ?? row.document?.id,
    chunkId: row.chunk_id ?? row.id,
    content: row.content,
    similarity: typeof row.similarity === "number" ? row.similarity : 0,
    title: row.title ?? row.document?.title ?? "",
    sourceType: row.source_type ?? row.document?.source_type ?? "document",
    sourceUri: row.source_uri ?? row.document?.source_uri ?? null,
    metadata: row.metadata ?? row.document?.metadata ?? {},
  };
}

export interface SupabaseVectorStoreOptions {
  url?: string;
  serviceKey?: string;
}

export class SupabaseVectorStore implements VectorStore {
  private client: SupabaseClient<any, "public", any>;

  constructor(client: SupabaseClient<any, "public", any>) {
    this.client = client;
  }

  static fromEnv(options: SupabaseVectorStoreOptions = {}): SupabaseVectorStore {
    const url = options.url ?? process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = options.serviceKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      throw new Error(
        "Supabase URL and SUPABASE_SERVICE_ROLE_KEY must be provided to use SupabaseVectorStore.fromEnv"
      );
    }

    const client = createClient(url, serviceKey);
    return new SupabaseVectorStore(client);
  }

  static fromClient(client: SupabaseClient<any, "public", any>): SupabaseVectorStore {
    return new SupabaseVectorStore(client);
  }

  async upsertDocument(document: VectorDocumentUpsert): Promise<VectorDocumentRecord> {
    const payload = {
      id: document.id ?? undefined,
      org_id: document.orgId ?? null,
      title: document.title,
      source_type: document.sourceType,
      source_uri: document.sourceUri ?? null,
      checksum: document.checksum,
      metadata: document.metadata ?? {},
      token_count: document.tokenCount ?? null,
      created_by: document.createdBy ?? null,
    };

    const { data, error } = await this.client
      .from("ai_documents")
      .upsert(payload, { onConflict: "org_id,checksum" })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert AI document: ${error.message}`);
    }

    return mapDocument(data);
  }

  async replaceDocumentChunks(documentId: string, chunks: VectorChunkRecord[]): Promise<void> {
    const { error: deleteError } = await this.client
      .from("ai_document_chunks")
      .delete()
      .eq("document_id", documentId);

    if (deleteError) {
      throw new Error(`Failed to delete existing chunks: ${deleteError.message}`);
    }

    if (!chunks.length) {
      return;
    }

    const insertPayload = chunks.map((chunk) => ({
      document_id: documentId,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      embedding: chunk.embedding,
      token_count: chunk.tokenCount ?? null,
    }));

    const { error } = await this.client.from("ai_document_chunks").insert(insertPayload);

    if (error) {
      throw new Error(`Failed to insert document chunks: ${error.message}`);
    }
  }

  async getDocumentChunks(documentId: string): Promise<StoredChunkRecord[]> {
    const { data, error } = await this.client
      .from("ai_document_chunks")
      .select(
        "id, document_id, chunk_index, content, embedding, token_count, created_at, updated_at"
      )
      .eq("document_id", documentId)
      .order("chunk_index", { ascending: true });

    if (error) {
      throw new Error(`Failed to load document chunks: ${error.message}`);
    }

    return (data ?? []).map(mapChunk);
  }

  async logIngestionJob(job: IngestionJobInsert): Promise<IngestionJobRecord> {
    const payload = {
      document_id: job.documentId ?? null,
      source_type: job.sourceType,
      source_uri: job.sourceUri ?? null,
      status: job.status ?? "processing",
      metrics: job.metrics ?? {},
      error: job.error ?? null,
    };

    const { data, error } = await this.client
      .from("ai_ingestion_jobs")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to log ingestion job: ${error.message}`);
    }

    return mapJob(data);
  }

  async updateIngestionJob(id: string, update: IngestionJobUpdate): Promise<void> {
    const payload: Record<string, unknown> = {};

    if (update.documentId !== undefined) {
      payload.document_id = update.documentId;
    }

    if (update.status !== undefined) {
      payload.status = update.status;
    }

    if (update.metrics !== undefined) {
      payload.metrics = update.metrics;
    }

    if (update.error !== undefined) {
      payload.error = update.error;
    }

    if (Object.keys(payload).length === 0) {
      return;
    }

    const { error } = await this.client.from("ai_ingestion_jobs").update(payload).eq("id", id);

    if (error) {
      throw new Error(`Failed to update ingestion job: ${error.message}`);
    }
  }

  async listDocuments(filter: DocumentFilter = {}): Promise<VectorDocumentRecord[]> {
    let query = this.client.from("ai_documents").select("*");

    if (filter.orgId !== undefined) {
      if (filter.orgId === null) {
        query = query.is("org_id", null);
      } else {
        query = query.eq("org_id", filter.orgId);
      }
    }

    if (filter.ids && filter.ids.length > 0) {
      query = query.in("id", filter.ids);
    }

    const { data, error } = await query.order("updated_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list AI documents: ${error.message}`);
    }

    return (data ?? []).map(mapDocument);
  }

  async listJobs(filter: JobFilter = {}): Promise<IngestionJobRecord[]> {
    let query = this.client.from("ai_ingestion_jobs").select("*");

    if (filter.since) {
      query = query.gte("started_at", filter.since);
    }

    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    const { data, error } = await query.order("started_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list ingestion jobs: ${error.message}`);
    }

    return (data ?? []).map(mapJob);
  }

  async logReindexEvent(event: ReindexEventInsert): Promise<void> {
    const payload = {
      triggered_by: event.triggeredBy ?? null,
      reason: event.reason ?? null,
      target_org: event.targetOrg ?? null,
      job_count: event.jobCount ?? 0,
      chunk_count: event.chunkCount ?? 0,
    };

    const { error } = await this.client.from("ai_reindex_events").insert(payload);

    if (error) {
      throw new Error(`Failed to log reindex event: ${error.message}`);
    }
  }

  async matchEmbedding(
    embedding: number[],
    options: MatchQueryOptions = {}
  ): Promise<MatchResult[]> {
    const { data, error } = await this.client.rpc("match_ai_document_chunks", {
      query_embedding: embedding,
      match_count: options.matchCount ?? 5,
      match_threshold: options.matchThreshold ?? 0.68,
      filter_org: options.orgId ?? null,
    });

    if (error) {
      throw new Error(`Failed to match embeddings: ${error.message}`);
    }

    return (data ?? []).map(mapMatch);
  }

  async keywordSearch(
    queryText: string,
    options: KeywordSearchOptions = {}
  ): Promise<MatchResult[]> {
    let query = this.client
      .from("ai_document_chunks")
      .select("id, content, document:ai_documents(id, title, source_type, source_uri, metadata)")
      .ilike("content", `%${queryText}%`)
      .order("updated_at", { ascending: false })
      .limit(options.matchCount ?? 5);

    if (options.orgId !== undefined) {
      if (options.orgId === null) {
        query = query.filter("document.org_id", "is", null);
      } else {
        query = query.filter("document.org_id", "eq", options.orgId);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to execute keyword search: ${error.message}`);
    }

    return (data ?? []).map(mapMatch);
  }
}
