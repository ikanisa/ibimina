import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UseRealtimeSubscriptionOptions<T> {
  table: string;
  filter?: string;
  onUpdate?: (payload: any) => void;
  onInsert?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

export function useRealtimeSubscription<T>({
  table,
  filter,
  onUpdate,
  onInsert,
  onDelete,
}: UseRealtimeSubscriptionOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Initial fetch
    const fetchData = async () => {
      try {
        let query = supabase.from(table).select('*');
        
        if (filter) {
          query = query.filter(filter);
        }

        const { data: initialData, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setData(initialData as T);
        setIsLoading(false);
      } catch (err) {
        setError(err as Error);
        setIsLoading(false);
      }
    };

    fetchData();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && onInsert) {
            onInsert(payload);
          } else if (payload.eventType === 'UPDATE' && onUpdate) {
            onUpdate(payload);
          } else if (payload.eventType === 'DELETE' && onDelete) {
            onDelete(payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, onUpdate, onInsert, onDelete]);

  return { data, error, isLoading };
}
