/**
 * @ibimina/providers - Multi-country provider adapters
 *
 * Pluggable ingestion adapters for statement and SMS parsing
 * across different countries and telecom providers.
 */

// Export types
export type {
  ParsedTransaction,
  ParseResult,
  ProviderAdapter,
  StatementAdapter,
  SmsAdapter,
  AdapterRegistryEntry,
} from "./types/adapter.js";

// Export registry
export { adapterRegistry, registerDefaultAdapters } from "./registry/index.js";

// Export adapters
export { MTNRwandaStatementAdapter } from "./adapters/RW/MTNStatementAdapter.js";
export { MTNRwandaSmsAdapter } from "./adapters/RW/MTNSmsAdapter.js";

// Export agent session store
export type {
  AgentSession,
  AgentSessionStore,
  RedisSessionStore,
  SupabaseSessionStore,
} from "./agent/session-store.js";
