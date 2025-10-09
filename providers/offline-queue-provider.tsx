"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { enqueueAction, listActions, removeAction, updateAction, type OfflineAction } from "@/lib/offline/queue";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/providers/toast-provider";
import type { Database } from "@/lib/supabase/types";

type QueueInput = {
  type: string;
  payload: Record<string, unknown>;
  summary: { primary: string; secondary: string };
};

interface OfflineQueueContextValue {
  isOnline: boolean;
  processing: boolean;
  actions: OfflineAction[];
  pendingCount: number;
  queueAction: (input: QueueInput) => Promise<OfflineAction>;
  retryFailed: () => Promise<void>;
  clearAction: (id: string) => Promise<void>;
}

const OfflineQueueContext = createContext<OfflineQueueContextValue | null>(null);

async function safeListActions() {
  try {
    return await listActions();
  } catch {
    return [];
  }
}

export function OfflineQueueProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseBrowserClient();
  const toast = useToast();
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [actions, setActions] = useState<OfflineAction[]>([]);
  const [processing, setProcessing] = useState(false);

  const refresh = useCallback(async () => {
    const all = await safeListActions();
    setActions(all);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  type PaymentStatus = Database["public"]["Tables"]["payments"]["Row"]["status"];

  type QueueHandler = (action: OfflineAction) => Promise<void>;

  const handlers = useMemo<Record<string, QueueHandler>>(
    () => ({
      "payments:update-status": async (action: OfflineAction) => {
        const { ids, status } = action.payload as { ids?: string[]; status?: PaymentStatus };
        if (!ids?.length || !status) {
          throw new Error("Invalid payload for status update");
        }
        const updatePayload = { status } satisfies Partial<Database["public"]["Tables"]["payments"]["Row"]>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from("payments").update(updatePayload).in("id", ids);
        if (error) {
          throw new Error(error.message ?? "Failed to update payment status");
        }
      },
      "payments:assign": async (action: OfflineAction) => {
        const { ids, ikiminaId, memberId } = action.payload as {
          ids?: string[];
          ikiminaId?: string;
          memberId?: string | null;
        };
        if (!ids?.length || !ikiminaId) {
          throw new Error("Invalid payload for ikimina assignment");
        }

        const updatePayload: Partial<Database["public"]["Tables"]["payments"]["Row"]> = { ikimina_id: ikiminaId };
        if (memberId !== undefined) {
          updatePayload.member_id = memberId;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from("payments").update(updatePayload).in("id", ids);
        if (error) {
          throw new Error(error.message ?? "Failed to assign ikimina");
        }
      },
    }),
    [supabase],
  );

  const processQueue = useCallback(async () => {
    if (!isOnline || processing) {
      return;
    }

    const pending = await safeListActions();
    if (pending.length === 0) {
      setActions(pending);
      return;
    }

    setProcessing(true);
    try {
      for (const action of pending) {
        const handler = handlers[action.type];
        if (!handler) {
          await removeAction(action.id);
          continue;
        }

        try {
          await updateAction(action.id, {
            status: "syncing",
            attempts: action.attempts + 1,
            lastError: null,
          });
          await handler(action);
          await removeAction(action.id);
          toast.success(action.summary.primary);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Sync failed";
          await updateAction(action.id, {
            status: "failed",
            attempts: action.attempts + 1,
            lastError: message,
          });
          toast.error(`${action.summary.primary}: ${message}`);
        }
      }
    } finally {
      setProcessing(false);
      await refresh();
    }
  }, [handlers, isOnline, processing, refresh, toast]);

  useEffect(() => {
    if (isOnline) {
      void processQueue();
    }
  }, [isOnline, processQueue]);

  const queueAction = useCallback(
    async (input: QueueInput) => {
      const record = await enqueueAction(input);
      await refresh();
      toast.info(`${input.summary.primary} · ${input.summary.secondary}`);
      if (isOnline) {
        void processQueue();
      }
      return record;
    },
    [isOnline, processQueue, refresh, toast],
  );

  const retryFailed = useCallback(async () => {
    await processQueue();
  }, [processQueue]);

  const clearAction = useCallback(
    async (id: string) => {
      await removeAction(id);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo<OfflineQueueContextValue>(
    () => ({
      isOnline,
      processing,
      actions,
      pendingCount: actions.filter((action) => action.status !== "syncing").length,
      queueAction,
      retryFailed,
      clearAction,
    }),
    [actions, clearAction, isOnline, processing, queueAction, retryFailed],
  );

  return <OfflineQueueContext.Provider value={value}>{children}</OfflineQueueContext.Provider>;
}

export function useOfflineQueue() {
  const context = useContext(OfflineQueueContext);
  if (!context) {
    throw new Error("useOfflineQueue must be used within OfflineQueueProvider");
  }
  return context;
}
