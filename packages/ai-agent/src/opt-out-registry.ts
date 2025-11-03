import type { SupabaseClient } from "@supabase/supabase-js";

import { AgentOptOutError, AgentSessionError } from "./errors.js";
import type { AgentChannel, AgentOptOutRegistry } from "./types.js";

const DEFAULT_OPTOUT_TABLE = "agent_opt_outs" as const;

const matchesValue = (
  rowValue: string | null | undefined,
  inputValue: string | null | undefined
) => {
  if (rowValue === null || rowValue === undefined) {
    return true;
  }

  return rowValue === inputValue;
};

export interface SupabaseAgentOptOutRegistryOptions {
  client: SupabaseClient;
  table?: string;
  enabled?: boolean;
}

export class SupabaseAgentOptOutRegistry implements AgentOptOutRegistry {
  private readonly client: SupabaseClient;
  private readonly table: string;
  private readonly enabled: boolean;

  constructor(options: SupabaseAgentOptOutRegistryOptions) {
    this.client = options.client;
    this.table = options.table ?? DEFAULT_OPTOUT_TABLE;
    this.enabled = options.enabled ?? true;
  }

  async ensureAllowed(input: {
    orgId: string;
    userId: string | null;
    channel: AgentChannel;
  }): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const { data, error } = await this.client
      .from(this.table)
      .select("id, org_id, user_id, channel, expires_at")
      .or(`org_id.eq.${input.orgId},org_id.is.null`);

    if (error) {
      throw new AgentSessionError("Failed to load agent opt-out preferences", {
        error: error.message ?? String(error),
      });
    }

    const now = Date.now();
    const matching = (data ?? []).filter((row) => {
      const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : null;
      if (expiresAt !== null && expiresAt < now) {
        return false;
      }

      const rowUser: string | null = row.user_id ?? null;
      const rowChannel: string | null = row.channel ?? null;

      const userMatches = rowUser === null || rowUser === input.userId;
      const channelMatches = matchesValue(rowChannel, input.channel);

      return userMatches && channelMatches;
    });

    if (matching.length > 0) {
      throw new AgentOptOutError({
        orgId: input.orgId,
        userId: input.userId,
        channel: input.channel,
      });
    }
  }
}

export class NoopAgentOptOutRegistry implements AgentOptOutRegistry {
  async ensureAllowed(): Promise<void> {}
}
