import { type Redis } from "ioredis";
import type { SupabaseClient } from "@supabase/supabase-js";
export type AgentMessageRole = "system" | "user" | "assistant" | "tool";
export interface AgentMessage {
  role: AgentMessageRole;
  content: string;
  createdAt?: string;
}
export interface AgentSessionRecord {
  id: string;
  orgId: string;
  userId: string | null;
  channel: string;
  metadata: Record<string, unknown>;
  messages: AgentMessage[];
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  lastInteractionAt: Date;
}
export interface AgentSessionStore {
  get(sessionId: string): Promise<AgentSessionRecord | null>;
  save(session: AgentSessionRecord): Promise<AgentSessionRecord>;
  delete(sessionId: string): Promise<void>;
  touch(sessionId: string, expiresAt?: Date): Promise<void>;
}
interface BaseSessionStoreOptions {
  ttlSeconds?: number;
}
export interface SupabaseAgentSessionStoreOptions extends BaseSessionStoreOptions {
  driver: "supabase";
  client: SupabaseClient;
  table?: string;
}
export interface RedisAgentSessionStoreOptions extends BaseSessionStoreOptions {
  driver: "redis";
  url?: string;
  client?: Redis;
  namespace?: string;
}
export type AgentSessionStoreOptions =
  | SupabaseAgentSessionStoreOptions
  | RedisAgentSessionStoreOptions;
export declare function createAgentSessionStore(
  options: AgentSessionStoreOptions
): AgentSessionStore;
export type {
  AgentSessionStoreOptions,
  SupabaseAgentSessionStoreOptions,
  RedisAgentSessionStoreOptions,
};
