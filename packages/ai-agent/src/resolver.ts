import type {
  EmbeddingProvider,
  MatchResult,
  ResolverOptions,
  ResolverResult,
  VectorStore,
} from "./types.js";

export interface ResolverQueryOptions {
  orgId?: string | null;
  matchCount?: number;
  threshold?: number;
}

export class KnowledgeBaseResolver {
  constructor(
    private readonly store: VectorStore,
    private readonly embeddings: EmbeddingProvider,
    private readonly options: ResolverOptions = {}
  ) {}

  async search(query: string, options: ResolverQueryOptions = {}): Promise<ResolverResult> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { source: "empty", matches: [] };
    }

    const matchCount = options.matchCount ?? this.options.defaultMatchCount ?? 5;
    const threshold = options.threshold ?? this.options.defaultThreshold ?? 0.68;

    try {
      const [vector] = await this.embeddings.embed([trimmed]);
      if (vector && vector.length > 0) {
        const matches = await this.store.matchEmbedding(vector, {
          orgId: options.orgId ?? null,
          matchCount,
          matchThreshold: threshold,
        });

        if (matches.length > 0) {
          return { source: "vector", matches: sanitizeMatches(matches) };
        }
      }
    } catch (error) {
      // Swallow errors and fall back to keyword search
      console.warn("Vector search failed, falling back to keyword search", error);
    }

    const fallbackMatches = await this.store.keywordSearch(trimmed, {
      orgId: options.orgId ?? null,
      matchCount: this.options.fallbackLimit ?? matchCount,
    });

    if (fallbackMatches.length > 0) {
      return { source: "keyword", matches: sanitizeMatches(fallbackMatches) };
    }

    const terms = Array.from(new Set(trimmed.split(/\s+/).filter((token) => token.length > 3)));
    for (const term of terms) {
      const matches = await this.store.keywordSearch(term, {
        orgId: options.orgId ?? null,
        matchCount: this.options.fallbackLimit ?? matchCount,
      });

      if (matches.length > 0) {
        return { source: "keyword", matches: sanitizeMatches(matches) };
      }
    }

    return { source: "empty", matches: [] };
  }
}

function sanitizeMatches(matches: MatchResult[]): MatchResult[] {
  return matches.map((match) => ({
    ...match,
    metadata: match.metadata ?? {},
  }));
}
