import React from 'react';
import { createLogger } from './logger';

const logger = createLogger('performance');

/**
 * Performance monitoring utilities for production optimization
 */

// Performance metrics collection
export const performanceMetrics = {
  timing: new Map<string, number>(),
  marks: new Map<string, number>(),
  measures: new Map<string, number>(),
};

/**
 * Mark a performance timing point
 */
export const mark = (name: string): void => {
  if ('performance' in window) {
    performance.mark(name);
    performanceMetrics.marks.set(name, performance.now());
  }
};

/**
 * Measure performance between two marks
 */
export const measure = (name: string, startMark: string, endMark?: string): number | null => {
  if ('performance' in window) {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }
      
      const entries = performance.getEntriesByName(name, 'measure');
      const duration = entries[entries.length - 1]?.duration || 0;
      performanceMetrics.measures.set(name, duration);
      
      if (process.env.NODE_ENV === 'development') {
        logger.info(`${name}: ${duration.toFixed(2)}ms`);
      }
      
      return duration;
    } catch (error) {
      logger.error('Performance measurement failed:', error);
      return null;
    }
  }
  return null;
};

// Debounce function for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for scroll events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memoization helper
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    return result;
  }) as T;
}

// Lazy loading utility
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  return React.lazy(importFn);
}

// Virtual scrolling utility for large lists
export function calculateVisibleItems(
  containerHeight: number,
  itemHeight: number,
  scrollTop: number,
  totalItems: number
) {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    totalItems
  );
  
  return { startIndex, endIndex };
}

// Performance monitoring
export function measurePerformance(name: string, fn: () => void) {
  const start = performance.now();
  fn();
  const end = performance.now();
  
  performanceMetrics.timing.set(name, end - start);
  
  if (process.env.NODE_ENV === 'development') {
    logger.info(`${name}: ${(end - start).toFixed(2)}ms`);
  }
}

/**
 * Time a function execution with automatic cleanup
 */
export const timeFunction = <T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T => {
  return ((...args: any[]) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    performanceMetrics.timing.set(name, end - start);
    
    if (process.env.NODE_ENV === 'development') {
      logger.info(`${name}: ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  }) as T;
};

/**
 * Monitor Core Web Vitals
 */
export const monitorWebVitals = () => {
  if (typeof window === 'undefined') return;

  // CLS monitoring
  let clsValue = 0;
  let clsEntries: PerformanceEntry[] = [];

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
        clsEntries.push(entry);
      }
    }
  });

  try {
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    // Layout shift observer not supported
  }

  // Report metrics on page unload
  window.addEventListener('beforeunload', () => {
    if (process.env.NODE_ENV === 'production') {
      // In production, send to analytics
      const metrics = {
        cls: clsValue,
        lcp: performanceMetrics.measures.get('LCP'),
        fid: performanceMetrics.measures.get('FID'),
        timing: Object.fromEntries(performanceMetrics.timing),
      };
      
      // Send to analytics service
      navigator.sendBeacon('/api/metrics', JSON.stringify(metrics));
    }
  });
};

/**
 * Memory usage monitoring
 */
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576),
      allocated: Math.round(memory.totalJSHeapSize / 1048576),
      limit: Math.round(memory.jsHeapSizeLimit / 1048576),
    };
  }
  return null;
};

/**
 * Initialize performance monitoring
 */
export const initPerformanceMonitoring = () => {
  // Start monitoring on DOM content loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', monitorWebVitals);
  } else {
    monitorWebVitals();
  }
  
  // Monitor route changes for SPA
  let currentPath = window.location.pathname;
  const checkRouteChange = () => {
    const newPath = window.location.pathname;
    if (newPath !== currentPath) {
      mark(`route-change-${newPath}`);
      currentPath = newPath;
    }
    requestAnimationFrame(checkRouteChange);
  };
  
  requestAnimationFrame(checkRouteChange);
};

// Image lazy loading
export function createImageLoader() {
  const imageCache = new Map<string, HTMLImageElement>();
  
  return {
    preloadImage: (src: string): Promise<HTMLImageElement> => {
      if (imageCache.has(src)) {
        return Promise.resolve(imageCache.get(src)!);
      }
      
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          imageCache.set(src, img);
          resolve(img);
        };
        img.onerror = reject;
        img.src = src;
      });
    },
    
    clearCache: () => {
      imageCache.clear();
    }
  };
}