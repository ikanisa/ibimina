/**
 * Idempotency utilities for SACCO+ platform
 *
 * Provides helpers for implementing idempotent operations using the ops.idempotency table.
 * This ensures that sensitive operations (payments, transfers, approvals) can be safely
 * retried without duplicate execution.
 *
 * Usage:
 * ```typescript
 * import { withIdempotency } from '@/lib/idempotency';
 *
 * const result = await withIdempotency({
 *   key: 'payment-processing',
 *   userId: user.id,
 *   operation: async () => {
 *     // Your sensitive operation here
 *     return { success: true, transactionId: '123' };
 *   },
 *   ttlMinutes: 30
 * });
 * ```
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logError } from "@/lib/observability/logger";
import crypto from "crypto";

export interface IdempotencyOptions<T> {
  /** Unique key for the operation type (e.g., 'payment-processing', 'member-approval') */
  key: string;
  /** User ID performing the operation */
  userId: string;
  /** The operation to execute if not already cached */
  operation: () => Promise<T>;
  /** Request payload to hash for uniqueness (optional) */
  requestPayload?: Record<string, unknown>;
  /** Time-to-live in minutes (default: 60) */
  ttlMinutes?: number;
}

export interface IdempotencyResult<T> {
  /** Whether this was a cached result (true) or newly executed (false) */
  fromCache: boolean;
  /** The result of the operation */
  data: T;
}

/**
 * Generate a hash of the request payload for idempotency checking
 */
function hashRequest(payload: Record<string, unknown>): string {
  const normalized = JSON.stringify(payload, Object.keys(payload).sort());
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Execute an operation with idempotency protection
 *
 * If a matching idempotency record exists and hasn't expired, returns the cached result.
 * Otherwise, executes the operation, stores the result, and returns it.
 */
export async function withIdempotency<T>({
  key,
  userId,
  operation,
  requestPayload,
  ttlMinutes = 60,
}: IdempotencyOptions<T>): Promise<IdempotencyResult<T>> {
  const supabase = await createSupabaseServerClient();
  const requestHash = requestPayload ? hashRequest(requestPayload) : null;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

  try {
    // Check for existing idempotency record
    const { data: existing, error: checkError } = await supabase
      .from("idempotency")
      .select("response, expires_at")
      .eq("key", key)
      .eq("user_id", userId)
      .eq("request_hash", requestHash ?? "")
      .single();

    if (!checkError && existing) {
      // Check if the record has expired
      const isExpired = new Date(existing.expires_at) < new Date();

      if (!isExpired) {
        // Return cached result
        return {
          fromCache: true,
          data: existing.response as T,
        };
      }

      // Record expired, will execute and update
    }

    // Execute the operation
    const result = await operation();

    // Store the result
    const { error: insertError } = await supabase.from("idempotency").upsert(
      {
        key,
        user_id: userId,
        request_hash: requestHash ?? "",
        response: result as unknown as Record<string, unknown>,
        expires_at: expiresAt,
      },
      {
        onConflict: "key,user_id,request_hash",
      }
    );

    if (insertError) {
      logError("idempotency_store_failed", {
        key,
        userId,
        error: insertError,
      });
      // Continue anyway - the operation succeeded
    }

    return {
      fromCache: false,
      data: result,
    };
  } catch (error) {
    logError("idempotency_operation_failed", {
      key,
      userId,
      error,
    });
    throw error;
  }
}

/**
 * Manually invalidate an idempotency record
 *
 * Use this when you need to allow an operation to be re-executed
 * (e.g., after a failed payment that needs to be retried)
 */
export async function invalidateIdempotency({
  key,
  userId,
  requestPayload,
}: {
  key: string;
  userId: string;
  requestPayload?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const requestHash = requestPayload ? hashRequest(requestPayload) : null;

  try {
    const { error } = await supabase
      .from("idempotency")
      .delete()
      .eq("key", key)
      .eq("user_id", userId)
      .eq("request_hash", requestHash ?? "");

    if (error) {
      logError("idempotency_invalidate_failed", {
        key,
        userId,
        error,
      });
    }
  } catch (error) {
    logError("idempotency_invalidate_error", {
      key,
      userId,
      error,
    });
  }
}

/**
 * Clean up expired idempotency records
 *
 * This should be run periodically (e.g., via cron) to prevent the table from growing unbounded
 */
export async function cleanupExpiredIdempotency(): Promise<{
  deleted: number;
  error?: string;
}> {
  const supabase = await createSupabaseServerClient();

  try {
    const { error, count } = await supabase
      .from("idempotency")
      .delete()
      .lt("expires_at", new Date().toISOString());

    if (error) {
      return {
        deleted: 0,
        error: error.message,
      };
    }

    return {
      deleted: count ?? 0,
    };
  } catch (error) {
    return {
      deleted: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
