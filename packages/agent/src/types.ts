import type { SupabaseClient } from "@supabase/supabase-js";

export type AgentRole = "system" | "user" | "assistant";

export interface AgentMessage {
  role: AgentRole;
  content: string;
}

export interface LocalizedCopy {
  rw: string;
  en: string;
  fr: string;
}

export interface AllocationRow {
  id: string;
  groupName: string;
  amount: number;
  reference: string;
  status: string;
  allocatedAt: string;
}

export interface AllocationPayload {
  heading: LocalizedCopy;
  subheading: LocalizedCopy;
  allocations: AllocationRow[];
}

export interface TicketPayload {
  heading: LocalizedCopy;
  reference: string;
  status: LocalizedCopy;
  submittedAt: string;
  summary: LocalizedCopy;
}

export interface ToolExecutionResult {
  kind: string;
  payload: unknown;
  raw?: unknown;
}

export interface AgentToolResult {
  id: string;
  name: string;
  result?: unknown;
  error?: string;
}

export interface AgentSessionMetadata {
  orgId: string | null;
  orgName: string | null;
  country: string | null;
  lang: string;
  hashedIp: string | null;
}

export type AgentStreamEvent =
  | { type: "metadata"; data: AgentSessionMetadata }
  | { type: "token"; data: { text: string } }
  | { type: "message"; data: { text: string } }
  | { type: "tool_result"; data: AgentToolResult }
  | { type: "done"; data: { status: "completed" | "error" } }
  | { type: "error"; data: { message: string } };

export interface AgentClientOptions {
  supabase: SupabaseLikeClient;
  apiKey: string;
  model?: string;
  responsesUrl?: string;
  fetch?: typeof fetch;
  systemPrompt?: string | ((context: AgentPromptContext) => string);
}

export interface AgentPromptContext {
  language: string;
  orgName: string | null;
  country: string | null;
}

export interface AgentConversationOptions {
  messages: AgentMessage[];
  user: { id: string; orgId?: string | null };
  hashedIp?: string | null;
  locale?: string;
  signal?: AbortSignal;
  onEvent: (event: AgentStreamEvent) => Promise<void> | void;
}

export interface SupabaseLikeClient {
  rpc: <T = unknown>(
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: T | null; error: { message?: string } | null }>;
  from: SupabaseClient["from"];
}

export interface ToolExecutionContext {
  userId: string;
  orgId: string | null;
  lang: string;
}

export interface AgentToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}
