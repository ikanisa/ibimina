import { useCallback, useEffect, useRef, useState } from "react";

interface UseResourceLoaderOptions<T> {
  immediate?: boolean;
  initialData?: T;
}

export function useResourceLoader<T>(
  fetcher: () => Promise<T>,
  options: UseResourceLoaderOptions<T> = { immediate: true }
) {
  const { immediate = true, initialData } = options;
  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<Error | undefined>();
  const [loading, setLoading] = useState<boolean>(Boolean(immediate));
  const abortRef = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    abortRef.current = false;

    try {
      const response = await fetcher();
      if (!abortRef.current) {
        setData(response);
      }
    } catch (err) {
      if (!abortRef.current) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      }
    } finally {
      if (!abortRef.current) {
        setLoading(false);
      }
    }
  }, [fetcher]);

  useEffect(() => {
    if (immediate) {
      refresh();
    }

    return () => {
      abortRef.current = true;
    };
  }, [immediate, refresh]);

  return { data, error, loading, refresh } as const;
}
