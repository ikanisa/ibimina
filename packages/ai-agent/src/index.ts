/**
 * AI Agent Package
 *
 * This package houses the logic for the AI-powered customer support agent.
 * It provides utilities for interacting with OpenAI's API and managing
 * conversational AI workflows for the Ibimina SACCO platform.
 */

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: Message[];
  model?: string;
  temperature?: number;
}

export interface ChatResponse {
  message: string;
  error?: string;
  escalate?: boolean;
}

export interface StreamChunk {
  type: "token" | "metrics";
  data?: string;
  metrics?: Record<string, number>;
}

interface GuardrailDecision {
  outcome: "allow" | "refuse" | "escalate";
  message: string;
}

const CROSS_TENANT_PATTERNS: RegExp[] = [
  /cross[-\s]?tenant/i,
  /other\s+(?:sacco|tenant|cooperative)/i,
  /outside\s+(?:our\s+)?tenant/i,
  /data\s+for\s+.*\s+tenant/i,
  /different\s+branch\s+member/i,
];

const SENSITIVE_PATTERNS: RegExp[] = [
  /delete\s+all\s+transactions?/i,
  /override\s+(?:loan|limit)/i,
  /transfer\s+funds/i,
  /reset\s+(?:mfa|2fa|biometric)/i,
  /disable\s+.*security/i,
];

const KNOWLEDGE_BASE: Array<{ keywords: string[]; response: string }> = [
  {
    keywords: ["loan", "status"],
    response:
      "Loan applications are reviewed within one business day. You can track progress from the Loans workspace dashboard.",
  },
  {
    keywords: ["ticket", "create"],
    response:
      "New support tickets capture the member ID, channel, and summary. The operations desk will triage it immediately.",
  },
  {
    keywords: ["tool", "help"],
    response:
      "Use the productivity quick actions on the dashboard to jump into bulk member onboarding, reconciliations, or reporting.",
  },
];

function normalise(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function detectGuardrail(content: string): GuardrailDecision | null {
  const normalised = normalise(content);

  for (const pattern of CROSS_TENANT_PATTERNS) {
    if (pattern.test(normalised)) {
      return {
        outcome: "refuse",
        message:
          "I’m sorry, but I can’t provide information about members from another SACCO tenant. Please work through the official escalation channel.",
      };
    }
  }

  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(normalised)) {
      return {
        outcome: "escalate",
        message:
          "This is a sensitive action that requires supervisor approval. I’ve flagged it for the operations lead to review.",
      };
    }
  }

  return null;
}

function resolveFromKnowledgeBase(prompt: string): string | null {
  const text = normalise(prompt);
  for (const entry of KNOWLEDGE_BASE) {
    if (entry.keywords.every((keyword) => text.includes(keyword))) {
      return entry.response;
    }
  }
  return null;
}

function now(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }

  return Date.now();
}

export class AIAgent {
  private apiKey: string;
  private cache = new Map<string, ChatResponse>();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async plan(request: ChatRequest): Promise<ChatResponse> {
    const latestMessage = [...request.messages].reverse().find((msg) => msg.role === "user");
    if (!latestMessage) {
      return { message: "How can I support you today?" };
    }

    const prompt = latestMessage.content;
    const cacheKey = normalise(prompt);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const [guardrail, knowledgeMatch] = await Promise.all([
      Promise.resolve(detectGuardrail(prompt)),
      Promise.resolve(resolveFromKnowledgeBase(prompt)),
    ]);

    if (guardrail) {
      const response: ChatResponse = {
        message: guardrail.message,
        ...(guardrail.outcome === "escalate" ? { escalate: true } : {}),
      };
      this.cache.set(cacheKey, response);
      return response;
    }

    if (knowledgeMatch) {
      const response: ChatResponse = { message: knowledgeMatch };
      this.cache.set(cacheKey, response);
      return response;
    }

    const response: ChatResponse = {
      message:
        "I’ll gather the latest information from the Ibimina knowledge base and respond shortly. If it’s urgent, please create a support ticket so a human agent can assist.",
    };
    this.cache.set(cacheKey, response);
    return response;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.plan(request);
  }

  async *streamChat(request: ChatRequest): AsyncGenerator<StreamChunk, ChatResponse> {
    const started = now();
    const plan = await this.plan(request);
    const tokens = plan.message.split(/(\s+)/);

    for (const token of tokens) {
      if (!token) continue;
      yield { type: "token", data: token };
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    const completed = now();
    yield { type: "metrics", metrics: { durationMs: completed - started } };

    return plan;
  }
}

export default AIAgent;
