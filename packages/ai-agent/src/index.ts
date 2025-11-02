export { bootstrapAgentSession, runAgentTurn } from "./orchestrator.js";
export { createDefaultTools } from "./tools.js";
export { evaluateGuardrails, type GuardrailDecision } from "./guardrails.js";

// Export embedding and vector store functionality (from PR #305)
export { EmbeddingProvider } from "./embeddingProvider.js";
export { DocumentIngestion } from "./ingestion.js";
export { VectorStore } from "./vectorStore.js";
export { MemoryStore } from "./memoryStore.js";
export { resolveQuery } from "./resolver.js";
export { monitorEmbeddings } from "./monitoring.js";

// Export session management and rate limiting (from PR #307)
export { AIAgent } from "./agent.js";
export { OptOutRegistry } from "./opt-out-registry.js";
export { RateLimiter } from "./rate-limiter.js";
export { UsageLogger } from "./usage-logger.js";
export * from "./errors.js";

export type {
  AgentName,
  ChatRequest,
  ChatResponse,
  Message,
  SessionState,
  ToolInvocation,
} from "./types.js";
