import type {
  AgentMessage,
  AgentMessageRole,
  AgentSessionRecord,
  AgentSessionStore,
} from "@ibimina/providers";

export type { AgentMessage, AgentMessageRole, AgentSessionRecord, AgentSessionStore };

export type AgentChannel = "web" | "whatsapp" | "email" | "ivr" | "api" | string;

export interface AgentChatRequest {
  orgId: string;
  userId: string | null;
  sessionId?: string | null;
  message: string;
  channel: AgentChannel;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  rateLimitKey?: string | null;
}

export interface AgentChatResponse {
  sessionId: string;
  message: string;
  messages: AgentMessage[];
  usage?: AgentUsageSummary | null;
  createdAt: Date;
  model: string;
}

export interface AgentUsageSummary {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  costUsd?: number | null;
}

export interface AgentUsageEvent extends AgentUsageSummary {
  sessionId: string;
  orgId: string;
  userId: string | null;
  channel: AgentChannel;
  model: string;
  latencyMs: number;
  metadata?: Record<string, unknown>;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface AgentRateLimitConfig {
  maxHits?: number;
  windowSeconds?: number;
  key?: string;
}

export interface AgentRateLimiter {
  enforce(config: { key: string; maxHits?: number; windowSeconds?: number }): Promise<void>;
}

export interface AgentUsageLogger {
  log(event: AgentUsageEvent): Promise<void>;
}

export interface AgentOptOutRegistry {
  ensureAllowed(input: {
    orgId: string;
    userId: string | null;
    channel: AgentChannel;
  }): Promise<void>;
}

export interface OpenAIResponsesClient {
  create(input: Record<string, unknown>): Promise<Record<string, any>>;
}

export interface OpenAIClientLike {
  responses: OpenAIResponsesClient;
}

export interface AgentOptions {
  model: string;
  temperature?: number;
  systemPrompt?: string;
  maxOutputTokens?: number;
  maxHistoryMessages?: number;
  sessionTtlSeconds?: number;
  sessionStore: AgentSessionStore;
  rateLimiter?: AgentRateLimiter;
  usageLogger?: AgentUsageLogger;
  optOutRegistry?: AgentOptOutRegistry;
  openai: OpenAIClientLike;
}
