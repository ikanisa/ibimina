import test from "node:test";
import assert from "node:assert/strict";

import { AIAgent, AgentOptOutError, AgentValidationError } from "../src/index.js";
import type {
  AgentOptOutRegistry,
  AgentRateLimiter,
  AgentSessionRecord,
  AgentSessionStore,
  AgentUsageEvent,
  AgentUsageLogger,
  AgentChatRequest,
} from "../src/index.js";

class InMemorySessionStore implements AgentSessionStore {
  private readonly store = new Map<string, AgentSessionRecord>();

  async get(sessionId: string): Promise<AgentSessionRecord | null> {
    return this.store.get(sessionId) ?? null;
  }

  async save(session: AgentSessionRecord): Promise<AgentSessionRecord> {
    const snapshot: AgentSessionRecord = {
      ...session,
      metadata: { ...session.metadata },
      messages: session.messages.map((message) => ({ ...message })),
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      lastInteractionAt: new Date(session.lastInteractionAt),
      expiresAt: new Date(session.expiresAt),
    };

    this.store.set(session.id, snapshot);
    return snapshot;
  }

  async delete(sessionId: string): Promise<void> {
    this.store.delete(sessionId);
  }

  async touch(): Promise<void> {}
}

class StubOpenAI {
  constructor(private readonly text: string) {}

  responses = {
    create: async () => ({
      output_text: this.text,
      usage: {
        prompt_tokens: 12,
        completion_tokens: 32,
        total_tokens: 44,
      },
    }),
  };
}

class RecordingRateLimiter implements AgentRateLimiter {
  readonly calls: string[] = [];

  async enforce(config: { key: string }): Promise<void> {
    this.calls.push(config.key);
  }
}

class RecordingUsageLogger implements AgentUsageLogger {
  readonly events: AgentUsageEvent[] = [];

  async log(event: AgentUsageEvent): Promise<void> {
    this.events.push(event);
  }
}

class OptOutRegistry implements AgentOptOutRegistry {
  constructor(private readonly allowed: boolean) {}

  async ensureAllowed(): Promise<void> {
    if (!this.allowed) {
      throw new AgentOptOutError();
    }
  }
}

const baseRequest = (overrides: Partial<AgentChatRequest> = {}): AgentChatRequest => ({
  orgId: "org-1",
  userId: "user-1",
  message: "Hello",
  channel: "web",
  metadata: {},
  ipAddress: "127.0.0.1",
  ...overrides,
});

test("creates new session and stores messages", async () => {
  const sessionStore = new InMemorySessionStore();
  const usageLogger = new RecordingUsageLogger();
  const agent = new AIAgent({
    model: "gpt-test",
    sessionStore,
    openai: new StubOpenAI("Hello from AI"),
    usageLogger,
  });

  const result = await agent.chat(baseRequest());

  assert.equal(result.message, "Hello from AI");
  assert.equal(result.messages.length, 2);
  assert.equal(result.messages.at(-1)?.content, "Hello from AI");

  const saved = await sessionStore.get(result.sessionId);
  assert(saved);
  assert.equal(saved?.messages.length, 2);
  assert.equal(saved?.messages[0]?.role, "user");
  assert.equal(saved?.messages[1]?.role, "assistant");
  assert.equal(usageLogger.events.length, 1);
  assert.equal(usageLogger.events[0]?.success, true);
});

test("reuses existing session history", async () => {
  const sessionStore = new InMemorySessionStore();
  const agent = new AIAgent({
    model: "gpt-test",
    sessionStore,
    openai: new StubOpenAI("Second reply"),
  });

  const initial = await agent.chat(baseRequest({ message: "Hi" }));
  const followup = await agent.chat(
    baseRequest({
      sessionId: initial.sessionId,
      message: "How are you?",
    })
  );

  assert.equal(followup.messages.length, 4);
  assert.equal(followup.messages.at(-1)?.content, "Second reply");
});

test("enforces rate limiter for org, user, and ip", async () => {
  const rateLimiter = new RecordingRateLimiter();
  const agent = new AIAgent({
    model: "gpt-test",
    sessionStore: new InMemorySessionStore(),
    openai: new StubOpenAI("Rate limited reply"),
    rateLimiter,
  });

  await agent.chat(baseRequest());

  assert(rateLimiter.calls.includes("org:org-1"));
  assert(rateLimiter.calls.includes("user:user-1"));
  assert(rateLimiter.calls.includes("ip:127.0.0.1"));
});

test("blocks requests when opt-out registry denies access", async () => {
  const agent = new AIAgent({
    model: "gpt-test",
    sessionStore: new InMemorySessionStore(),
    openai: new StubOpenAI("Should not reply"),
    optOutRegistry: new OptOutRegistry(false),
  });

  await assert.rejects(() => agent.chat(baseRequest()), AgentOptOutError);
});

test("validates non-empty message content", async () => {
  const agent = new AIAgent({
    model: "gpt-test",
    sessionStore: new InMemorySessionStore(),
    openai: new StubOpenAI(""),
  });

  await assert.rejects(() => agent.chat(baseRequest({ message: "   " })), AgentValidationError);
});
