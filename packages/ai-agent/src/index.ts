import { KnowledgeBaseResolver } from "./resolver.js";
import { EmbeddingIngestionPipeline } from "./ingestion.js";
import { OpenAIEmbeddingProvider } from "./embeddingProvider.js";
import { SupabaseVectorStore } from "./vectorStore.js";
import { InMemoryVectorStore } from "./memoryStore.js";
import { buildIngestionMetrics } from "./monitoring.js";
import type {
  ChatRequest,
  ChatResponse,
  EmbeddingProvider,
  ResolverOptions,
  VectorStore,
} from "./types.js";

export interface AIAgentOptions {
  embeddingProvider?: EmbeddingProvider;
  vectorStore?: VectorStore;
  resolverOptions?: ResolverOptions;
  openAIApiKey?: string;
  embeddingModel?: string;
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
}

function resolveApiKey(options: AIAgentOptions): string {
  const apiKey = options.openAIApiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY must be provided to use the AI agent");
  }

  return apiKey;
}

function truncate(text: string, limit = 240): string {
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit - 3)}...`;
}

export class AIAgent {
  private readonly resolver: KnowledgeBaseResolver;

  constructor(options?: string | AIAgentOptions) {
    const resolved: AIAgentOptions =
      typeof options === "string" ? { openAIApiKey: options } : (options ?? {});

    const embeddingProvider =
      resolved.embeddingProvider ??
      new OpenAIEmbeddingProvider({
        apiKey: resolveApiKey(resolved),
        model: resolved.embeddingModel,
      });

    const vectorStore =
      resolved.vectorStore ??
      SupabaseVectorStore.fromEnv({
        url: resolved.supabaseUrl,
        serviceKey: resolved.supabaseServiceRoleKey,
      });

    this.resolver = new KnowledgeBaseResolver(
      vectorStore,
      embeddingProvider,
      resolved.resolverOptions
    );
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const lastUserMessage = [...request.messages]
      .reverse()
      .find((message) => message.role === "user");
    const query = lastUserMessage?.content?.trim();

    if (!query) {
      return {
        message: "I need a question or statement to help you with. Please provide more details.",
        source: "empty",
        matches: [],
      };
    }

    try {
      const result = await this.resolver.search(query, {
        orgId: request.orgId ?? null,
        matchCount: request.topK,
      });

      const lines = result.matches.map((match, index) => {
        return `${index + 1}. ${match.title} — ${truncate(match.content)}`;
      });

      const message = lines.length
        ? `Top knowledge base matches (${result.source} search):\n${lines.join("\n")}`
        : "No relevant knowledge base entries were found. Consider adding documentation to the knowledge base.";

      return {
        message,
        matches: result.matches,
        source: result.source,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        message: `The AI agent could not process your request: ${message}`,
        error: message,
        source: "empty",
        matches: [],
      };
    }
  }
}

export {
  KnowledgeBaseResolver,
  EmbeddingIngestionPipeline,
  OpenAIEmbeddingProvider,
  SupabaseVectorStore,
  InMemoryVectorStore,
  buildIngestionMetrics,
};
export * from "./types.js";
