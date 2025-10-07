import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  enqueueQueuedAction,
  getQueuedActions,
  removeQueuedAction,
  QueuedAction,
} from "@/lib/offline-queue-store";
import { processQueuedAction } from "@/lib/offline-queue-processor";

interface OfflineQueueContextValue {
  queueSupabaseFunction: (functionName: string, payload: unknown) => Promise<void>;
  flushQueue: () => Promise<void>;
  queuedCount: number;
  isOnline: boolean;
}

const OfflineQueueContext = createContext<OfflineQueueContextValue | undefined>(undefined);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const OfflineQueueProvider = ({ children }: { children: React.ReactNode }) => {
  const [queuedCount, setQueuedCount] = useState(0);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);

  const flushQueue = useCallback(async () => {
    const actions = await getQueuedActions();
    let remaining = actions.length;

    for (const action of actions) {
      try {
        await processQueuedAction(action);
        await removeQueuedAction(action.id);
        remaining -= 1;
      } catch (error) {
        console.error("Failed to replay queued action", error);
        break;
      }
    }

    setQueuedCount(remaining);
  }, []);

  useEffect(() => {
    const syncQueuedCount = async () => {
      try {
        const actions = await getQueuedActions();
        setQueuedCount(actions.length);
      } catch (error) {
        console.error("Failed to load queued actions", error);
      }
    };

    syncQueuedCount();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushQueue();
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flushQueue]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const listener = (event: MessageEvent) => {
      const data = event.data as { type?: string; remaining?: number } | undefined;
      if (data?.type === "QUEUE_FLUSHED" && typeof data.remaining === "number") {
        setQueuedCount(data.remaining);
      }
    };

    navigator.serviceWorker.addEventListener("message", listener);
    return () => navigator.serviceWorker.removeEventListener("message", listener);
  }, []);

  const queueSupabaseFunction = useCallback(async (functionName: string, payload: unknown) => {
    if (!SUPABASE_URL) throw new Error("Missing Supabase URL");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const action: QueuedAction = {
      id: crypto.randomUUID(),
      url: `${SUPABASE_URL}/functions/v1/${functionName}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      createdAt: Date.now(),
      metadata: { functionName },
    };

    await enqueueQueuedAction(action);
    const actions = await getQueuedActions();
    setQueuedCount(actions.length);

    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if ("sync" in registration) {
        try {
          await registration.sync.register("flush-offline-queue");
        } catch (error) {
          console.warn("Background sync registration failed", error);
        }
      } else {
        await flushQueue();
      }
    }
  }, [flushQueue]);

  const value = useMemo<OfflineQueueContextValue>(
    () => ({ queueSupabaseFunction, flushQueue, queuedCount, isOnline }),
    [queueSupabaseFunction, flushQueue, queuedCount, isOnline],
  );

  return <OfflineQueueContext.Provider value={value}>{children}</OfflineQueueContext.Provider>;
};

export const useOfflineQueue = () => {
  const context = useContext(OfflineQueueContext);
  if (!context) {
    throw new Error("useOfflineQueue must be used within an OfflineQueueProvider");
  }
  return context;
};
