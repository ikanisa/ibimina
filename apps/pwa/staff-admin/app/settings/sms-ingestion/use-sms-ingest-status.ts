"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface SmsIngestStatusSummary {
  lastMessageAt: string | null;
  lastMessageStatus: string | null;
  lastFailureAt: string | null;
  lastFailureError: string | null;
  totalMessages: number;
  processedToday: number;
  failedToday: number;
  pendingMessages: number;
  ingestEventsTotal: number;
  ingestEventsLastAt: string | null;
}

export interface SmsIngestStatusResponse {
  saccoId: string | null;
  summary: SmsIngestStatusSummary;
  generatedAt: string;
}

interface UseSmsIngestStatusResult {
  data: SmsIngestStatusResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const DEFAULT_ERROR_MESSAGE = "Unable to load SMS ingestion status.";

export function useSmsIngestStatus(): UseSmsIngestStatusResult {
  const [data, setData] = useState<SmsIngestStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadStatus = useCallback(async (signal?: AbortSignal) => {
    if (!isMounted.current) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/staff/sms-ingest/status", {
        cache: "no-store",
        signal,
      });

      const payload = (await response.json()) as SmsIngestStatusResponse & { error?: string };

      if (!response.ok) {
        const message = typeof payload?.error === "string" ? payload.error : DEFAULT_ERROR_MESSAGE;
        throw new Error(message);
      }

      if (!isMounted.current) {
        return;
      }

      setData(payload);
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        return;
      }

      if (!isMounted.current) {
        return;
      }

      const message = err instanceof Error ? err.message : DEFAULT_ERROR_MESSAGE;
      setError(message);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadStatus(controller.signal);

    const interval = setInterval(() => {
      void loadStatus();
    }, 60_000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [loadStatus]);

  const refresh = useCallback(async () => {
    await loadStatus();
  }, [loadStatus]);

  return { data, loading, error, refresh };
}
