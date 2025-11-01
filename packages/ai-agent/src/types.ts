export type Role = "system" | "user" | "assistant";

export interface Message {
  role: Role;
  content: string;
  timestamp: number;
}

export interface ToolInvocation {
  name: string;
  args: Record<string, unknown>;
  result: string;
}

export interface AgentTurnResult {
  reply: string;
  handoff?: AgentName;
  toolInvocations?: ToolInvocation[];
}

export type AgentName = "triage" | "billing-specialist" | "technical-support" | "group-management";

export interface AgentContext {
  sessionId: string;
  history: Message[];
  tools: ToolRegistry;
}

export type AgentHandler = (input: string, context: AgentContext) => Promise<AgentTurnResult>;

export interface ToolRegistry {
  lookupMember: (membershipId: string) => Promise<string>;
  lookupTransaction: (transactionId: string) => Promise<string>;
  getPlatformDoc: (topic: string) => Promise<string>;
  systemHealth: () => Promise<string>;
}

export interface SessionState {
  id: string;
  currentAgent: AgentName;
  history: Message[];
  updatedAt: number;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
}

export interface ChatResponse {
  session: SessionState;
  reply: string;
  toolInvocations?: ToolInvocation[];
}
