import type { SupabaseClient } from "@supabase/supabase-js";

import type { AgentUsageEvent, AgentUsageLogger } from "./types.js";

const DEFAULT_USAGE_TABLE = "agent_usage_events" as const;

export interface SupabaseAgentUsageLoggerOptions {
  client: SupabaseClient;
  table?: string;
  enabled?: boolean;
}

export class SupabaseAgentUsageLogger implements AgentUsageLogger {
  private readonly client: SupabaseClient;
  private readonly table: string;
  private readonly enabled: boolean;

  constructor(options: SupabaseAgentUsageLoggerOptions) {
    this.client = options.client;
    this.table = options.table ?? DEFAULT_USAGE_TABLE;
    this.enabled = options.enabled ?? true;
  }

  async log(event: AgentUsageEvent): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const payload = {
      session_id: event.sessionId,
      org_id: event.orgId,
      user_id: event.userId,
      channel: event.channel,
      model: event.model,
      prompt_tokens: event.promptTokens ?? null,
      completion_tokens: event.completionTokens ?? null,
      total_tokens: event.totalTokens ?? null,
      cost_usd: event.costUsd ?? null,
      latency_ms: event.latencyMs,
      success: event.success,
      error_code: event.errorCode ?? null,
      error_message: event.errorMessage ?? null,
      metadata: event.metadata ?? {},
    };

    const { error } = await this.client.from(this.table).insert(payload);

    if (error) {
      console.error("agent.usage.log_failed", {
        table: this.table,
        error: error.message ?? String(error),
      });
    }
  }
}

export class NoopAgentUsageLogger implements AgentUsageLogger {
  async log(): Promise<void> {}
}
