"use client";

import { useCallback, useEffect, useState } from "react";

type Updater<T> = T | ((previous: T) => T);

export function usePersistentState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return initialValue;
      return JSON.parse(raw) as T;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn("usePersistentState:set", error);
    }
  }, [key, state]);

  const update = useCallback((value: Updater<T>) => {
    setState((prev) => (typeof value === "function" ? value(prev) : value));
  }, []);

  return [state, update] as const;
}
