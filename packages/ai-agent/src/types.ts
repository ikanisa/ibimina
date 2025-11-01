export type IngestionStatus = "pending" | "processing" | "completed" | "failed";

export interface KnowledgeDocumentInput {
  orgId?: string | null;
  title: string;
  content: string;
  sourceType: string;
  sourceUri?: string | null;
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
}

export interface VectorDocumentUpsert {
  id?: string;
  orgId?: string | null;
  title: string;
  sourceType: string;
  sourceUri?: string | null;
  checksum: string;
  metadata?: Record<string, unknown>;
  tokenCount?: number | null;
  createdBy?: string | null;
}

export interface VectorDocumentRecord {
  id: string;
  orgId: string | null;
  title: string;
  sourceType: string;
  sourceUri: string | null;
  checksum: string;
  metadata: Record<string, unknown>;
  tokenCount: number | null;
  createdBy: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface VectorChunkRecord {
  id?: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
  tokenCount?: number | null;
}

export interface StoredChunkRecord extends VectorChunkRecord {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IngestionJobInsert {
  documentId?: string | null;
  sourceType: string;
  sourceUri?: string | null;
  status?: IngestionStatus;
  metrics?: Record<string, unknown>;
  error?: string | null;
}

export interface IngestionJobUpdate {
  documentId?: string | null;
  status?: IngestionStatus;
  metrics?: Record<string, unknown>;
  error?: string | null;
}

export interface IngestionJobRecord extends Required<IngestionJobInsert> {
  id: string;
  status: IngestionStatus;
  startedAt: string;
  finishedAt: string | null;
}

export interface DocumentFilter {
  orgId?: string | null;
  ids?: string[];
}

export interface JobFilter {
  limit?: number;
  since?: string;
}

export interface ReindexEventInsert {
  triggeredBy?: string | null;
  reason?: string | null;
  targetOrg?: string | null;
  jobCount?: number;
  chunkCount?: number;
}

export interface MatchQueryOptions {
  orgId?: string | null;
  matchCount?: number;
  matchThreshold?: number;
}

export interface KeywordSearchOptions {
  orgId?: string | null;
  matchCount?: number;
}

export interface MatchResult {
  documentId: string;
  chunkId: string;
  content: string;
  similarity: number;
  title: string;
  sourceType: string;
  sourceUri: string | null;
  metadata: Record<string, unknown>;
}

export interface IngestionOutcome {
  documentId: string | null;
  jobId: string;
  chunkCount: number;
  tokenCount: number;
  checksum: string;
  status: IngestionStatus;
  error?: string;
}

export interface ReindexOptions {
  orgId?: string | null;
  documentIds?: string[];
  reason?: string;
  triggeredBy?: string | null;
}

export interface ReindexSummary {
  documentCount: number;
  totalChunks: number;
}

export interface ResolverOptions {
  defaultMatchCount?: number;
  defaultThreshold?: number;
  fallbackLimit?: number;
}

export interface ResolverResult {
  source: "vector" | "keyword" | "empty";
  matches: MatchResult[];
}

export interface MonitoringOptions {
  limit?: number;
  includeFailures?: number;
}

export interface IngestionMetrics {
  totalJobs: number;
  statusCounts: Record<IngestionStatus, number>;
  successRate: number;
  averageDurationMs: number | null;
  recentFailures: IngestionJobRecord[];
  lastUpdatedAt: string | null;
}

export interface ChatRequest {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  model?: string;
  temperature?: number;
  orgId?: string | null;
  topK?: number;
}

export interface ChatResponse {
  message: string;
  matches?: MatchResult[];
  source?: "vector" | "keyword" | "empty";
  error?: string;
}

export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
}

export interface VectorStore {
  upsertDocument(document: VectorDocumentUpsert): Promise<VectorDocumentRecord>;
  replaceDocumentChunks(documentId: string, chunks: VectorChunkRecord[]): Promise<void>;
  getDocumentChunks(documentId: string): Promise<StoredChunkRecord[]>;
  logIngestionJob(job: IngestionJobInsert): Promise<IngestionJobRecord>;
  updateIngestionJob(id: string, update: IngestionJobUpdate): Promise<void>;
  listDocuments(filter?: DocumentFilter): Promise<VectorDocumentRecord[]>;
  listJobs(filter?: JobFilter): Promise<IngestionJobRecord[]>;
  logReindexEvent(event: ReindexEventInsert): Promise<void>;
  matchEmbedding(embedding: number[], options: MatchQueryOptions): Promise<MatchResult[]>;
  keywordSearch(query: string, options: KeywordSearchOptions): Promise<MatchResult[]>;
}
