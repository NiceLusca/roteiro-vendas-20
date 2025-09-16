import { useState, useEffect, useCallback, useRef } from 'react';
import { createLogger } from '@/utils/logger';

const logger = createLogger('intelligent-cache');

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in ms
  maxSize?: number; // Maximum cache entries
  staleWhileRevalidate?: boolean; // Return stale data while refetching
  priority?: 'low' | 'normal' | 'high';
}

const DEFAULT_OPTIONS: Required<CacheOptions> = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  staleWhileRevalidate: true,
  priority: 'normal',
};

class IntelligentCache {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    this.startCleanup();
  }

  private startCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, 30000); // Cleanup every 30 seconds
  }

  private cleanup() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Remove expired entries
    entries.forEach(([key, entry]) => {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    });

    // If still over max size, remove least recently used
    if (this.cache.size > DEFAULT_OPTIONS.maxSize) {
      const sortedEntries = entries
        .filter(([key]) => this.cache.has(key))
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

      const entriesToRemove = sortedEntries.slice(0, this.cache.size - DEFAULT_OPTIONS.maxSize);
      entriesToRemove.forEach(([key]) => {
        this.cache.delete(key);
      });
    }

    logger.debug(`Cache cleanup completed. Size: ${this.cache.size}`);
  }

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + opts.ttl,
      accessCount: 0,
      lastAccessed: now,
    };

    this.cache.set(key, entry);

    // Immediate cleanup if over max size
    if (this.cache.size > opts.maxSize) {
      this.cleanup();
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    // Update access tracking
    entry.accessCount++;
    entry.lastAccessed = now;

    // Check if expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  isStale(key: string, staleTtl: number = 60000): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;

    const now = Date.now();
    return (now - entry.timestamp) > staleTtl;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    const keys = Array.from(this.cache.keys());
    
    keys.forEach(key => {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    });
  }

  getStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();

    return {
      size: this.cache.size,
      expired: entries.filter(([, entry]) => now > entry.expiresAt).length,
      avgAccessCount: entries.reduce((sum, [, entry]) => sum + entry.accessCount, 0) / entries.length || 0,
      memoryUsage: JSON.stringify(Array.from(this.cache.entries())).length,
    };
  }

  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cache.clear();
  }
}

const globalCache = new IntelligentCache();

export function useIntelligentCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stale, setStale] = useState(false);
  
  const fetcherRef = useRef(fetcher);
  const optionsRef = useRef(options);
  
  // Update refs without triggering re-renders
  fetcherRef.current = fetcher;
  optionsRef.current = options;

  const fetchData = useCallback(async (force = false) => {
    try {
      // Check cache first
      if (!force && globalCache.has(key)) {
        const cachedData = globalCache.get<T>(key);
        if (cachedData !== null) {
          setData(cachedData);
          setError(null);
          
          // Check if stale
          const isStale = globalCache.isStale(key, optionsRef.current.ttl ? optionsRef.current.ttl / 2 : 150000);
          setStale(isStale);
          
          // Background refresh if stale and staleWhileRevalidate is enabled
          if (isStale && optionsRef.current.staleWhileRevalidate !== false) {
            setLoading(true);
            try {
              const freshData = await fetcherRef.current();
              globalCache.set(key, freshData, optionsRef.current);
              setData(freshData);
              setStale(false);
            } catch (bgError) {
              logger.warn('Background refresh failed:', bgError);
            } finally {
              setLoading(false);
            }
          }
          
          return cachedData;
        }
      }

      // Fetch fresh data
      setLoading(true);
      setError(null);
      
      const freshData = await fetcherRef.current();
      
      globalCache.set(key, freshData, optionsRef.current);
      setData(freshData);
      setStale(false);
      
      return freshData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      logger.error('Cache fetch failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [key]);

  const invalidateCache = useCallback((pattern?: string) => {
    globalCache.invalidate(pattern || key);
    setData(null);
    setStale(false);
  }, [key]);

  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    stale,
    refetch: refresh,
    invalidate: invalidateCache,
    cache: globalCache,
  };
}

export { globalCache as intelligentCache };