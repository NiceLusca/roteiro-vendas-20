import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UseOptimizedQueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
  cacheTime?: number;
  staleTime?: number;
}

interface QueryResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Simple cache implementation
const queryCache = new Map<string, { data: any; timestamp: number }>();

export function useOptimizedSupabaseQuery<T>(
  key: string,
  queryFn: () => Promise<T[]>,
  options: UseOptimizedQueryOptions = {}
): QueryResult<T> {
  const {
    enabled = true,
    refetchInterval,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 1 * 60 * 1000, // 1 minute
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled || !user) return;

    try {
      // Check cache first
      const cached = queryCache.get(key);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < staleTime) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      setLoading(true);
      const result = await queryFn();
      
      // Update cache
      queryCache.set(key, { data: result, timestamp: now });
      
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [key, queryFn, enabled, user, staleTime]);

  const refetch = useCallback(async () => {
    // Clear cache for this key to force fresh data
    queryCache.delete(key);
    await fetchData();
  }, [key, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(fetchData, refetchInterval);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, fetchData]);

  // Cleanup cache periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      for (const [cacheKey, value] of queryCache.entries()) {
        if (now - value.timestamp > cacheTime) {
          queryCache.delete(cacheKey);
        }
      }
    }, cacheTime);

    return () => clearInterval(cleanup);
  }, [cacheTime]);

  return { data, loading, error, refetch };
}