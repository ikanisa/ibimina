import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { logError, logWarn } from "./observability/index.js";

const IDEMPOTENCY_SENTINEL_KEY = "__ibimina_idempotency__" as const;
const PENDING_SENTINEL = { [IDEMPOTENCY_SENTINEL_KEY]: "pending" } as const;
const DEFAULT_TTL_SECONDS = 60 * 60; // one hour
const DEFAULT_SERVICE_USER =
  process.env.WEBHOOK_IDEMPOTENCY_USER_ID ?? "00000000-0000-0000-0000-000000000000";

interface StoredRecord {
  response: unknown | null;
  request_hash: string;
  expires_at: string;
}

export interface WebhookIdempotencyStore {
  tryInsertPending(requestHash: string, expiresAt: string): Promise<"inserted" | "conflict">;
  fetchRecord(): Promise<StoredRecord | null>;
  updateRecord(response: unknown, requestHash: string, expiresAt: string): Promise<void>;
  removeRecord(): Promise<void>;
}

function isConflictError(error: PostgrestError | null): boolean {
  if (!error) {
    return false;
  }

  if (error.code === "23505") {
    return true;
  }

  return typeof error.message === "string" && error.message.toLowerCase().includes("duplicate");
}

function isPending(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    IDEMPOTENCY_SENTINEL_KEY in (value as Record<string, unknown>) &&
    (value as Record<string, unknown>)[IDEMPOTENCY_SENTINEL_KEY] === "pending"
  );
}

export function createSupabaseWebhookIdempotencyStore(
  client: SupabaseClient,
  key: string,
  userId: string = DEFAULT_SERVICE_USER
): WebhookIdempotencyStore {
  const table = () => client.schema("ops").from("idempotency");

  return {
    async tryInsertPending(requestHash: string, expiresAt: string) {
      const { error } = await table().insert(
        {
          key,
          user_id: userId,
          request_hash: requestHash,
          response: PENDING_SENTINEL,
          expires_at: expiresAt,
        },
        { returning: "minimal" }
      );

      if (!error) {
        return "inserted";
      }

      if (isConflictError(error)) {
        return "conflict";
      }

      logError("webhook_idempotency.insert_failed", { key, error: error.message });
      throw error;
    },
    async fetchRecord() {
      const { data, error } = await table()
        .select("response, request_hash, expires_at")
        .eq("key", key)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        logError("webhook_idempotency.fetch_failed", { key, error: error.message });
        throw error;
      }

      return (data as StoredRecord | null) ?? null;
    },
    async updateRecord(response: unknown, requestHash: string, expiresAt: string) {
      const { error } = await table()
        .update({ response, request_hash: requestHash, expires_at: expiresAt })
        .eq("key", key)
        .eq("user_id", userId);

      if (error) {
        logError("webhook_idempotency.update_failed", { key, error: error.message });
        throw error;
      }
    },
    async removeRecord() {
      const { error } = await table().delete().eq("key", key).eq("user_id", userId);
      if (error) {
        logWarn("webhook_idempotency.cleanup_failed", { key, error: error.message });
      }
    },
  };
}

export interface WebhookIdempotencyOptions<T> {
  store: WebhookIdempotencyStore;
  requestHash: string;
  ttlSeconds?: number;
  fallback: T;
  operation: () => Promise<T>;
  onPendingTimeout?: () => void;
}

export interface WebhookIdempotencyResult<T> {
  fromCache: boolean;
  data: T;
  timedOut: boolean;
}

const WAIT_INTERVAL_MS = 100;
const MAX_WAIT_ATTEMPTS = 6;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withWebhookIdempotency<T>({
  store,
  requestHash,
  ttlSeconds = DEFAULT_TTL_SECONDS,
  fallback,
  operation,
  onPendingTimeout,
}: WebhookIdempotencyOptions<T>): Promise<WebhookIdempotencyResult<T>> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  const insertResult = await store.tryInsertPending(requestHash, expiresAt);

  if (insertResult === "inserted") {
    try {
      const result = await operation();
      await store.updateRecord(result, requestHash, expiresAt);
      return { fromCache: false, data: result, timedOut: false };
    } catch (error) {
      await store.removeRecord().catch(() => {
        // Best effort cleanup; errors already logged in removeRecord
      });
      throw error;
    }
  }

  for (let attempt = 0; attempt < MAX_WAIT_ATTEMPTS; attempt += 1) {
    const record = await store.fetchRecord();

    if (!record) {
      break;
    }

    if (record.request_hash !== requestHash && !isPending(record.response)) {
      logWarn("webhook_idempotency.hash_mismatch", {
        requestHash,
        storedHash: record.request_hash,
      });
      break;
    }

    if (!isPending(record.response)) {
      return { fromCache: true, data: record.response as T, timedOut: false };
    }

    await wait(WAIT_INTERVAL_MS * 2 ** attempt);
  }

  onPendingTimeout?.();
  return { fromCache: true, data: fallback, timedOut: true };
}
