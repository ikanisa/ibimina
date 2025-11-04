import IORedis from "ioredis";
const DEFAULT_SESSION_TABLE = "agent_sessions";
const DEFAULT_REDIS_NAMESPACE = "ibimina:agent:sessions";
function ensureDate(value) {
  return value instanceof Date ? value : new Date(value);
}
function serializeSession(session) {
  return {
    id: session.id,
    org_id: session.orgId,
    user_id: session.userId,
    channel: session.channel,
    metadata: session.metadata ?? {},
    messages: session.messages ?? [],
    expires_at: session.expiresAt.toISOString(),
    created_at: session.createdAt.toISOString(),
    updated_at: session.updatedAt.toISOString(),
    last_interaction_at: session.lastInteractionAt.toISOString(),
  };
}
function parseSession(row) {
  if (!row) {
    return null;
  }
  const expiresAt = ensureDate(row.expires_at ?? row.expiresAt);
  const session = {
    id: row.id,
    orgId: row.org_id ?? row.orgId,
    userId: row.user_id ?? row.userId ?? null,
    channel: row.channel,
    metadata: row.metadata ?? {},
    messages: Array.isArray(row.messages) ? row.messages : [],
    expiresAt,
    createdAt: ensureDate(row.created_at ?? row.createdAt ?? new Date()),
    updatedAt: ensureDate(row.updated_at ?? row.updatedAt ?? new Date()),
    lastInteractionAt: ensureDate(
      row.last_interaction_at ?? row.lastInteractionAt ?? row.updated_at ?? new Date()
    ),
  };
  if (Number.isFinite(session.expiresAt.getTime()) && session.expiresAt.getTime() < Date.now()) {
    return null;
  }
  return session;
}
class SupabaseAgentSessionStore {
  options;
  table;
  ttlSeconds;
  constructor(options) {
    this.options = options;
    this.table = options.table ?? DEFAULT_SESSION_TABLE;
    this.ttlSeconds = options.ttlSeconds;
  }
  mapSession(row) {
    const parsed = parseSession(row);
    if (!parsed) {
      return null;
    }
    // If TTL is configured, refresh expiry for active sessions
    if (this.ttlSeconds) {
      const newExpiry = new Date(Date.now() + this.ttlSeconds * 1000);
      if (parsed.expiresAt.getTime() < newExpiry.getTime()) {
        parsed.expiresAt = newExpiry;
      }
    }
    return parsed;
  }
  async get(sessionId) {
    const { data, error } = await this.options.client
      .from(this.table)
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to load agent session: ${error.message}`);
    }
    const mapped = this.mapSession(data);
    if (!mapped && data) {
      // Session expired, remove from store
      await this.delete(sessionId).catch(() => undefined);
    }
    return mapped;
  }
  async save(session) {
    const now = new Date();
    const expiresAt = this.ttlSeconds
      ? new Date(Date.now() + this.ttlSeconds * 1000)
      : session.expiresAt;
    const payload = serializeSession({
      ...session,
      expiresAt,
      updatedAt: now,
      lastInteractionAt: session.lastInteractionAt ?? now,
    });
    const { data, error } = await this.options.client
      .from(this.table)
      .upsert(payload, { onConflict: "id" })
      .select()
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to persist agent session: ${error.message}`);
    }
    const mapped = this.mapSession(data ?? payload);
    if (!mapped) {
      throw new Error("Failed to deserialize persisted agent session");
    }
    return mapped;
  }
  async touch(sessionId, expiresAt) {
    const patch = {
      last_interaction_at: new Date().toISOString(),
    };
    if (expiresAt) {
      patch.expires_at = expiresAt.toISOString();
    } else if (this.ttlSeconds) {
      patch.expires_at = new Date(Date.now() + this.ttlSeconds * 1000).toISOString();
    }
    const { error } = await this.options.client.from(this.table).update(patch).eq("id", sessionId);
    if (error) {
      throw new Error(`Failed to update agent session heartbeat: ${error.message}`);
    }
  }
  async delete(sessionId) {
    const { error } = await this.options.client.from(this.table).delete().eq("id", sessionId);
    if (error) {
      throw new Error(`Failed to delete agent session: ${error.message}`);
    }
  }
}
class RedisAgentSessionStore {
  options;
  client;
  namespace;
  ttlSeconds;
  constructor(options) {
    this.options = options;
    this.namespace = options.namespace ?? DEFAULT_REDIS_NAMESPACE;
    this.client = options.client ?? new IORedis(options.url ?? "redis://localhost:6379");
    this.ttlSeconds = options.ttlSeconds;
  }
  key(sessionId) {
    return `${this.namespace}:${sessionId}`;
  }
  deserialize(value) {
    if (!value) {
      return null;
    }
    try {
      const parsed = JSON.parse(value);
      return parseSession({
        ...parsed,
        expires_at: parsed.expiresAt,
        created_at: parsed.createdAt,
        updated_at: parsed.updatedAt,
        last_interaction_at: parsed.lastInteractionAt,
      });
    } catch (error) {
      console.error("agent.session.redis.deserialize_failed", {
        error,
      });
      return null;
    }
  }
  serialize(session) {
    return JSON.stringify({
      ...session,
      expiresAt: session.expiresAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      lastInteractionAt: session.lastInteractionAt.toISOString(),
    });
  }
  async get(sessionId) {
    const key = this.key(sessionId);
    const value = await this.client.get(key);
    const session = this.deserialize(value);
    if (!session && value) {
      await this.client.del(key).catch(() => undefined);
    }
    return session;
  }
  async save(session) {
    const now = new Date();
    const expiresAt = this.ttlSeconds
      ? new Date(Date.now() + this.ttlSeconds * 1000)
      : session.expiresAt;
    const normalized = {
      ...session,
      expiresAt,
      updatedAt: now,
      lastInteractionAt: session.lastInteractionAt ?? now,
    };
    const ttlMs = Math.max(expiresAt.getTime() - Date.now(), 1);
    await this.client.set(this.key(session.id), this.serialize(normalized), "PX", ttlMs);
    return normalized;
  }
  async touch(sessionId, expiresAt) {
    const key = this.key(sessionId);
    const ttlTarget = expiresAt
      ? expiresAt.getTime() - Date.now()
      : this.ttlSeconds
        ? this.ttlSeconds * 1000
        : null;
    if (ttlTarget && ttlTarget > 0) {
      await this.client.pexpire(key, ttlTarget);
    } else if (ttlTarget === null) {
      // Without a TTL we simply ensure the key exists by updating timestamp metadata
      const session = await this.get(sessionId);
      if (session) {
        await this.save({
          ...session,
          lastInteractionAt: new Date(),
        });
      }
    }
  }
  async delete(sessionId) {
    await this.client.del(this.key(sessionId));
  }
}
export function createAgentSessionStore(options) {
  if (options.driver === "supabase") {
    if (!options.client) {
      throw new Error("Supabase client is required for agent session store");
    }
    return new SupabaseAgentSessionStore(options);
  }
  if (options.driver === "redis") {
    if (!options.client && !options.url) {
      throw new Error(
        "Redis agent session store requires either a client instance or connection URL"
      );
    }
    return new RedisAgentSessionStore(options);
  }
  throw new Error(`Unsupported agent session store driver: ${options.driver}`);
}
