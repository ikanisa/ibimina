import Constants from "expo-constants";
import { streamSSE } from "../../../lib/sse";

const BASE_URL =
  Constants.expoConfig?.extra?.assistBaseUrl ?? process.env.EXPO_PUBLIC_ASSIST_URL ?? "";

const requireBase = () => {
  if (!BASE_URL) {
    throw new Error("Missing assist base URL");
  }
  return BASE_URL;
};

export type AssistToolResponse<T> = {
  data: T;
  elapsedMs: number;
};

export async function invokeTool<T>(
  tool: string,
  payload: Record<string, unknown>
): Promise<AssistToolResponse<T>> {
  const started = Date.now();
  const response = await fetch(`${requireBase()}/tools/${tool}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Tool ${tool} failed: ${response.status}`);
  }

  return {
    data: (await response.json()) as T,
    elapsedMs: Date.now() - started,
  };
}

export type AssistMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolInvocations?: Array<{ tool: string; latencyMs: number }>;
};

export type AssistStreamEvent =
  | { type: "message-start"; messageId: string }
  | { type: "message-delta"; messageId: string; delta: string }
  | { type: "message-end"; messageId: string }
  | { type: "tool"; messageId: string; invocations: Array<{ tool: string; latencyMs: number }> };

export async function streamAssistMessage({
  threadId,
  content,
  signal,
  onEvent,
}: {
  threadId: string;
  content: string;
  signal?: AbortSignal;
  onEvent: (event: AssistStreamEvent) => void | Promise<void>;
}) {
  const response = await fetch(`${requireBase()}/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: content, sessionId: threadId }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to stream message: ${response.status}`);
  }

  await streamSSE<{ type: string; messageId?: string; delta?: string; invocations?: Array<{ tool: string; latencyMs: number }> }>({
    response,
    signal,
    onMessage: async ({ event, data }) => {
      if (event === "message" && typeof data === "object" && data) {
        const messageId = typeof data.messageId === "string" ? data.messageId : undefined;
        if (!messageId) {
          return;
        }
        if (data.type === "message-start") {
          await onEvent({ type: "message-start", messageId });
          return;
        }
        if (data.type === "message-delta" && typeof data.delta === "string") {
          await onEvent({ type: "message-delta", messageId, delta: data.delta });
          return;
        }
        if (data.type === "message-end") {
          await onEvent({ type: "message-end", messageId });
          return;
        }
      }

      if (event === "tool" && typeof data === "object" && data) {
        const messageId = typeof data.messageId === "string" ? data.messageId : undefined;
        if (!messageId) {
          return;
        }
        await onEvent({
          type: "tool",
          messageId,
          invocations: Array.isArray(data.invocations) ? (data.invocations as Array<{ tool: string; latencyMs: number }>) : [],
        });
      }
    },
  });
}
