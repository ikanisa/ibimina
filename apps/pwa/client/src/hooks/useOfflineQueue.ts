"use client";

import { useCallback, useEffect, useState } from "react";

type OfflineQueueState = {
  pendingCount: number;
  refresh: () => void;
  clear: () => void;
};

const STORAGE_KEY = "ibimina:offline-queue";

type StoredQueue = {
  id: string;
  createdAt: string;
  type: string;
}[];

function readQueue(): StoredQueue {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.warn("Failed to parse offline queue", error);
    return [];
  }
}

export function useOfflineQueue(): OfflineQueueState {
  const [pendingCount, setPendingCount] = useState<number>(() => readQueue().length);

  const refresh = useCallback(() => {
    setPendingCount(readQueue().length);
  }, []);

  const clear = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
    setPendingCount(0);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        refresh();
      }
    };

    window.addEventListener("storage", handleStorage);
    const handleQueueUpdate = () => refresh();
    window.addEventListener("offline-queue:updated", handleQueueUpdate);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("offline-queue:updated", handleQueueUpdate);
    };
  }, [refresh]);

  return { pendingCount, refresh, clear };
}
