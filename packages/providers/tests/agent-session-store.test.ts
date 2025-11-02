import test from "node:test";
import assert from "node:assert/strict";

import { createAgentSessionStore, type AgentSessionRecord } from "../src/agent/session-store.js";

class FakeRedisClient {
  store = new Map<string, string>();
  ttl = new Map<string, number>();

  async get(key: string) {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string, mode: string, ttlMs: number) {
    if (mode !== "PX") {
      throw new Error(`Unexpected mode ${mode}`);
    }
    this.store.set(key, value);
    this.ttl.set(key, ttlMs);
  }

  async del(key: string) {
    this.store.delete(key);
    this.ttl.delete(key);
  }

  async pexpire(key: string, ttlMs: number) {
    this.ttl.set(key, ttlMs);
    return 1;
  }
}

const baseSession = (overrides: Partial<AgentSessionRecord> = {}): AgentSessionRecord => {
  const now = new Date("2024-01-01T00:00:00.000Z");
  return {
    id: "session-test",
    orgId: "org-test",
    userId: "user-test",
    channel: "web",
    metadata: {},
    messages: [],
    createdAt: now,
    updatedAt: now,
    lastInteractionAt: now,
    expiresAt: new Date(Date.now() + 60_000),
    ...overrides,
  };
};

test("createAgentSessionStore requires redis configuration", () => {
  assert.throws(
    () => createAgentSessionStore({ driver: "redis", namespace: "demo" }),
    /Redis agent session store requires either a client instance or connection URL/
  );
});

test("createAgentSessionStore requires supabase client", () => {
  assert.throws(
    () =>
      // @ts-expect-error intentionally missing client
      createAgentSessionStore({ driver: "supabase" }),
    /Supabase client is required for agent session store/
  );
});

test("redis session store persists and loads sessions", async () => {
  const fake = new FakeRedisClient();
  const store = createAgentSessionStore({
    driver: "redis",
    client: fake as unknown as any,
  });

  const saved = await store.save(baseSession());
  const loaded = await store.get(saved.id);

  assert.equal(loaded?.id, saved.id);
  assert.equal(loaded?.orgId, saved.orgId);
});

test("redis session store touch refreshes ttl", async () => {
  const fake = new FakeRedisClient();
  const store = createAgentSessionStore({
    driver: "redis",
    client: fake as unknown as any,
    ttlSeconds: 90,
  });

  const saved = await store.save(baseSession({ id: "session-touch" }));
  await store.touch(saved.id);

  const ttl = fake.ttl.get("ibimina:agent:sessions:session-touch");
  assert(ttl && ttl > 0);
});

const serializeRow = (session: AgentSessionRecord) => ({
  id: session.id,
  org_id: session.orgId,
  user_id: session.userId,
  channel: session.channel,
  metadata: session.metadata,
  messages: session.messages,
  expires_at: session.expiresAt.toISOString(),
  created_at: session.createdAt.toISOString(),
  updated_at: session.updatedAt.toISOString(),
  last_interaction_at: session.lastInteractionAt.toISOString(),
});

type SupabaseRow = ReturnType<typeof serializeRow>;

class FakeSupabaseClient {
  rows = new Map<string, SupabaseRow>();
  lastId: string | null = null;

  from() {
    const self = this;
    return {
      select() {
        return this;
      },
      eq(_: string, value: string) {
        self.lastId = value;
        return this;
      },
      maybeSingle: async () => ({
        data: self.lastId ? (self.rows.get(self.lastId) ?? null) : null,
        error: null,
      }),
      upsert(payload: SupabaseRow) {
        self.rows.set(payload.id, payload);
        return this;
      },
      update(patch: Partial<SupabaseRow>) {
        return {
          eq: async (_: string, value: string) => {
            const existing = self.rows.get(value);
            if (existing) {
              self.rows.set(value, { ...existing, ...patch });
            }
            return { error: null };
          },
        };
      },
      delete() {
        return {
          eq: async (_: string, value: string) => {
            self.rows.delete(value);
            return { error: null };
          },
        };
      },
    } as const;
  }
}

test("supabase session store saves, loads, and deletes sessions", async () => {
  const client = new FakeSupabaseClient();
  const store = createAgentSessionStore({
    driver: "supabase",
    client: client as unknown as any,
  });

  const saved = await store.save(baseSession({ id: "session-supa" }));
  const loaded = await store.get(saved.id);
  assert.equal(loaded?.id, saved.id);

  await store.delete(saved.id);
  const afterDelete = await store.get(saved.id);
  assert.equal(afterDelete, null);
});
