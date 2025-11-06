import { randomUUID } from "node:crypto";

import { AgentOpenAIError, AgentSessionError, AgentValidationError } from "./errors.js";
import {
  type AgentChatRequest,
  type AgentChatResponse,
  type AgentMessage,
  type AgentOptOutRegistry,
  type AgentOptions,
  type AgentRateLimiter,
  type AgentSessionRecord,
  type AgentUsageLogger,
  type AgentUsageSummary,
} from "./types.js";
import { NoopAgentUsageLogger } from "./usage-logger.js";
import { NoopAgentOptOutRegistry } from "./opt-out-registry.js";

const DEFAULT_SYSTEM_PROMPT =
  "You are Ibimina's AI assistant. Provide concise, trustworthy answers using the information provided. " +
  "If you are unsure or the question falls outside your scope, escalate to a human staff member.";
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60; // 1 hour
const DEFAULT_MAX_HISTORY_MESSAGES = 12;
const DEFAULT_TEMPERATURE = 0.3;

const toTimestamp = (value: Date) => value.toISOString();

const extractTextFromResponse = (result: Record<string, any>): string => {
  const text = typeof result.output_text === "string" ? result.output_text.trim() : "";
  if (text.length > 0) {
    return text;
  }

  const output = Array.isArray(result.output) ? result.output : [];
  for (const entry of output) {
    const content = Array.isArray(entry?.content) ? entry.content : [];
    for (const piece of content) {
      const value =
        typeof piece?.text?.value === "string"
          ? piece.text.value
          : typeof piece?.text === "string"
            ? piece.text
            : typeof piece?.content === "string"
              ? piece.content
              : null;
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }
    }
  }

  const candidates = Array.isArray(result?.content) ? result.content : [];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return "";
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return undefined;
};

const extractUsage = (result: Record<string, any>): AgentUsageSummary => {
  const usage = result?.usage ?? null;
  if (!usage) {
    return {};
  }

  return {
    promptTokens: toNumber(usage.prompt_tokens ?? usage.promptTokens),
    completionTokens: toNumber(usage.completion_tokens ?? usage.completionTokens),
    totalTokens: toNumber(usage.total_tokens ?? usage.totalTokens),
    costUsd: toNumber(usage.cost_usd ?? usage.costUsd) ?? null,
  };
};

const now = () => new Date();

export class AIAgent {
  private readonly options: AgentOptions;
  private readonly sessionTtlSeconds: number;
  private readonly maxHistoryMessages: number;
  private readonly usageLogger: AgentUsageLogger;
  private readonly optOutRegistry: AgentOptOutRegistry;
  private readonly rateLimiter?: AgentRateLimiter;

  constructor(options: AgentOptions) {
    if (!options.sessionStore) {
      throw new AgentSessionError("A session store must be provided for the AI agent");
    }

    this.options = {
      ...options,
      systemPrompt: options.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
      temperature: options.temperature ?? DEFAULT_TEMPERATURE,
    };

    this.sessionTtlSeconds = options.sessionTtlSeconds ?? DEFAULT_SESSION_TTL_SECONDS;
    this.maxHistoryMessages = Math.max(
      options.maxHistoryMessages ?? DEFAULT_MAX_HISTORY_MESSAGES,
      0
    );
    this.usageLogger = options.usageLogger ?? new NoopAgentUsageLogger();
    this.optOutRegistry = options.optOutRegistry ?? new NoopAgentOptOutRegistry();
    this.rateLimiter = options.rateLimiter;
  }

  private buildRateLimitKeys(request: AgentChatRequest): string[] {
    const keys = new Set<string>();
    keys.add(`org:${request.orgId}`);

    if (request.userId) {
      keys.add(`user:${request.userId}`);
    }

    if (request.ipAddress) {
      keys.add(`ip:${request.ipAddress}`);
    }

    if (request.rateLimitKey && request.rateLimitKey.trim().length > 0) {
      keys.add(request.rateLimitKey.trim());
    }

    return Array.from(keys);
  }

  private trimHistory(messages: AgentMessage[]): AgentMessage[] {
    if (this.maxHistoryMessages === 0) {
      return [];
    }

    if (messages.length <= this.maxHistoryMessages) {
      return [...messages];
    }

    return messages.slice(-this.maxHistoryMessages);
  }

  private createNewSession(request: AgentChatRequest): AgentSessionRecord {
    const createdAt = now();
    return {
      id:
        request.sessionId && request.sessionId.trim().length > 0 ? request.sessionId : randomUUID(),
      orgId: request.orgId,
      userId: request.userId ?? null,
      channel: request.channel,
      metadata: { ...(request.metadata ?? {}) },
      messages: [],
      createdAt,
      updatedAt: createdAt,
      lastInteractionAt: createdAt,
      expiresAt: new Date(createdAt.getTime() + this.sessionTtlSeconds * 1000),
    };
  }

  private ensureSessionIntegrity(session: AgentSessionRecord, request: AgentChatRequest) {
    if (session.orgId !== request.orgId) {
      throw new AgentSessionError("Session belongs to a different organization", {
        sessionOrg: session.orgId,
        requestOrg: request.orgId,
      });
    }

    if (session.userId && request.userId && session.userId !== request.userId) {
      throw new AgentSessionError("Session belongs to a different user", {
        sessionUser: session.userId,
        requestUser: request.userId,
      });
    }
  }

  private mergeMetadata(
    session: AgentSessionRecord,
    metadata?: Record<string, unknown>,
    ipAddress?: string | null
  ) {
    if (metadata && Object.keys(metadata).length > 0) {
      session.metadata = { ...session.metadata, ...metadata };
    }

    if (ipAddress) {
      session.metadata = {
        ...session.metadata,
        last_ip: ipAddress,
      };
    }
  }

  private async loadSession(sessionId: string): Promise<AgentSessionRecord | null> {
    try {
      return await this.options.sessionStore.get(sessionId);
    } catch (error) {
      throw new AgentSessionError("Failed to load agent session", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async saveSession(session: AgentSessionRecord): Promise<AgentSessionRecord> {
    try {
      return await this.options.sessionStore.save(session);
    } catch (error) {
      throw new AgentSessionError("Failed to persist agent session", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async chat(request: AgentChatRequest): Promise<AgentChatResponse> {
    const trimmedMessage = request.message.trim();
    if (trimmedMessage.length === 0) {
      throw new AgentValidationError("Message cannot be empty");
    }

    await this.optOutRegistry.ensureAllowed({
      orgId: request.orgId,
      userId: request.userId ?? null,
      channel: request.channel,
    });

    const rateLimitKeys = this.rateLimiter ? this.buildRateLimitKeys(request) : [];
    for (const key of rateLimitKeys) {
      await this.rateLimiter?.enforce({ key });
    }

    let session: AgentSessionRecord | null = null;
    if (request.sessionId) {
      session = await this.loadSession(request.sessionId);
    }

    if (!session) {
      session = this.createNewSession(request);
    }

    this.ensureSessionIntegrity(session, request);
    this.mergeMetadata(session, request.metadata, request.ipAddress);

    const history = this.trimHistory(session.messages);
    const conversation = [
      { role: "system", content: this.options.systemPrompt! },
      ...history.map((message) => ({ role: message.role, content: message.content })),
      { role: "user", content: trimmedMessage },
    ];

    const startedAt = Date.now();
    let answer: string;
    let usage: AgentUsageSummary = {};

    try {
      const response = await this.options.openai.responses.create({
        model: this.options.model,
        input: conversation,
        temperature: this.options.temperature,
        max_output_tokens: this.options.maxOutputTokens,
      });

      answer = extractTextFromResponse(response);
      if (!answer) {
        throw new AgentOpenAIError("OpenAI returned an empty response");
      }

      usage = extractUsage(response);
    } catch (error) {
      const latency = Date.now() - startedAt;
      await this.usageLogger.log({
        sessionId: session.id,
        orgId: session.orgId,
        userId: session.userId,
        channel: session.channel,
        model: this.options.model,
        promptTokens: undefined,
        completionTokens: undefined,
        totalTokens: undefined,
        costUsd: null,
        latencyMs: latency,
        metadata: { failure: true },
        success: false,
        errorCode: "openai_error",
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof AgentOpenAIError) {
        throw error;
      }

      throw new AgentOpenAIError("Failed to generate a response from OpenAI", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const interactionTimestamp = now();
    const userMessage: AgentMessage = {
      role: "user",
      content: trimmedMessage,
      createdAt: toTimestamp(interactionTimestamp),
    };
    const assistantMessage: AgentMessage = {
      role: "assistant",
      content: answer,
      createdAt: toTimestamp(interactionTimestamp),
    };

    const updatedHistory = this.trimHistory([...history, userMessage, assistantMessage]);

    session.messages = updatedHistory;
    session.lastInteractionAt = interactionTimestamp;
    session.updatedAt = interactionTimestamp;
    session.expiresAt = new Date(interactionTimestamp.getTime() + this.sessionTtlSeconds * 1000);

    const persisted = await this.saveSession(session);

    const latency = Date.now() - startedAt;
    await this.usageLogger.log({
      sessionId: persisted.id,
      orgId: persisted.orgId,
      userId: persisted.userId,
      channel: persisted.channel,
      model: this.options.model,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      costUsd: usage.costUsd ?? null,
      latencyMs: latency,
      metadata: {
        rateLimitKeys,
        ip: request.ipAddress ?? null,
      },
      success: true,
    });

    return {
      sessionId: persisted.id,
      message: answer,
      messages: persisted.messages,
      usage,
      createdAt: persisted.updatedAt,
      model: this.options.model,
    };
  }
}
