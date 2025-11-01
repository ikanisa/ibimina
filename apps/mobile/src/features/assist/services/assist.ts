import Constants from "expo-constants";

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

export async function sendAssistMessage(threadId: string, content: string): Promise<AssistMessage> {
  const response = await fetch(`${requireBase()}/threads/${threadId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.status}`);
  }

  return (await response.json()) as AssistMessage;
}
