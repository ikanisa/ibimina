export type ChatRole = "user" | "assistant";

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
  status: "CONFIRMED" | "PENDING";
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

export interface ToolResultPayload {
  id: string;
  name: string;
  status: "success" | "error";
  data: unknown;
}

export type MessageContent =
  | { type: "text"; text: string; streaming?: boolean }
  | { type: "allocation"; payload: AllocationPayload }
  | { type: "ticket"; payload: TicketPayload }
  | { type: "tool-result"; payload: ToolResultPayload };

export interface ChatMessage {
  id: string;
  role: ChatRole;
  createdAt: number;
  contents: MessageContent[];
}

export type QuickActionKey = "ussd" | "reference" | "statements" | "ticket";

export type SupportedLocale = "rw" | "en" | "fr";
