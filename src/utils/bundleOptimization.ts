import { lazy, ComponentType } from 'react';
import { createLogger } from './logger';

const logger = createLogger('bundle');

// Resource preloading utilities
export class ResourcePreloader {
  private static preloadedResources = new Set<string>();
  private static linkElements = new Map<string, HTMLLinkElement>();

  static preloadScript(src: string, priority: 'high' | 'low' = 'low'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.preloadedResources.has(src)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = src;
      if (priority === 'high') {
        link.fetchPriority = 'high';
      }

      link.onload = () => {
        this.preloadedResources.add(src);
        resolve();
      };
      link.onerror = reject;

      document.head.appendChild(link);
      this.linkElements.set(src, link);
    });
  }

  static preloadModule(moduleSpecifier: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.preloadedResources.has(moduleSpecifier)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = moduleSpecifier;

      link.onload = () => {
        this.preloadedResources.add(moduleSpecifier);
        resolve();
      };
      link.onerror = reject;

      document.head.appendChild(link);
      this.linkElements.set(moduleSpecifier, link);
    });
  }

  static preloadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      if (this.preloadedResources.has(src)) {
        // Return existing image if already preloaded
        const img = new Image();
        img.src = src;
        resolve(img);
        return;
      }

      const img = new Image();
      img.onload = () => {
        this.preloadedResources.add(src);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  static cleanup(src: string): void {
    const link = this.linkElements.get(src);
    if (link && link.parentNode) {
      link.parentNode.removeChild(link);
    }
    this.linkElements.delete(src);
    this.preloadedResources.delete(src);
  }

  static getStats() {
    return {
      preloadedCount: this.preloadedResources.size,
      linkElementsCount: this.linkElements.size,
      preloadedResources: Array.from(this.preloadedResources)
    };
  }
}

// Intelligent lazy loading with preloading
interface LazyComponentOptions {
  preload?: boolean;
  fallback?: React.ComponentType;
  retryAttempts?: number;
  retryDelay?: number;
}

export function createSmartLazy<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): React.LazyExoticComponent<T> {
  const {
    preload = false,
    retryAttempts = 3,
    retryDelay = 1000
  } = options;

  let importPromise: Promise<{ default: T }> | null = null;

  const loadWithRetry = async (attempt = 1): Promise<{ default: T }> => {
    try {
      return await importFn();
    } catch (error) {
      if (attempt < retryAttempts) {
        logger.warn(`Component load failed, retrying (${attempt}/${retryAttempts})`, error);
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        return loadWithRetry(attempt + 1);
      }
      logger.error('Component load failed after all retries', error);
      throw error;
    }
  };

  const wrappedImportFn = () => {
    if (!importPromise) {
      importPromise = loadWithRetry();
    }
    return importPromise;
  };

  const LazyComponent = lazy(wrappedImportFn);

  // Preload if requested
  if (preload) {
    // Preload after a short delay to not block initial render
    setTimeout(() => {
      wrappedImportFn().catch(error => {
        logger.warn('Preload failed:', error);
      });
    }, 100);
  }

  return LazyComponent;
}

// Route-based code splitting with intelligent preloading
export class RoutePreloader {
  private static routeMap = new Map<string, () => Promise<any>>();
  private static preloadedRoutes = new Set<string>();

  static registerRoute(path: string, importFn: () => Promise<any>) {
    this.routeMap.set(path, importFn);
  }

  static preloadRoute(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.preloadedRoutes.has(path)) {
        resolve();
        return;
      }

      const importFn = this.routeMap.get(path);
      if (!importFn) {
        reject(new Error(`Route not found: ${path}`));
        return;
      }

      importFn()
        .then(() => {
          this.preloadedRoutes.add(path);
          logger.debug(`Route preloaded: ${path}`);
          resolve();
        })
        .catch(reject);
    });
  }

  static preloadRoutesByPattern(pattern: RegExp | string): Promise<void[]> {
    const routes = Array.from(this.routeMap.keys());
    const matchingRoutes = routes.filter(route => {
      if (typeof pattern === 'string') {
        return route.includes(pattern);
      }
      return pattern.test(route);
    });

    return Promise.all(
      matchingRoutes.map(route => this.preloadRoute(route))
    );
  }

  // Preload routes based on user behavior
  static intelligentPreload(currentPath: string, userHistory: string[]) {
    // Analyze user patterns and preload likely next routes
    const routeFrequency = new Map<string, number>();
    
    userHistory.forEach(route => {
      routeFrequency.set(route, (routeFrequency.get(route) || 0) + 1);
    });

    // Get most frequent routes
    const frequentRoutes = Array.from(routeFrequency.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([route]) => route);

    // Preload frequent routes that aren't the current one
    frequentRoutes
      .filter(route => route !== currentPath)
      .forEach(route => {
        this.preloadRoute(route).catch(error => {
          logger.warn(`Intelligent preload failed for ${route}:`, error);
        });
      });
  }
}

// Bundle analysis utilities
export class BundleAnalyzer {
  private static performanceEntries: PerformanceEntry[] = [];

  static startAnalysis() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      this.performanceEntries = performance.getEntriesByType('navigation');
      
      // Monitor resource loading
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            logger.debug('Resource loaded:', {
              name: entry.name,
              duration: entry.duration,
              size: (entry as any).transferSize || 0
            });
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['resource'] });
      } catch (error) {
        logger.warn('Performance observer not supported:', error);
      }
    }
  }

  static getLoadingStats() {
    if (!('performance' in window)) {
      return null;
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      const jsResources = resources.filter(r => 
        r.name.includes('.js') || r.name.includes('/_next/') || r.name.includes('/static/')
      );

      const totalJSSize = jsResources.reduce((sum, resource) => {
        return sum + ((resource as any).transferSize || 0);
      }, 0);

      logger.debug('Loading performance calculated', {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        totalResources: resources.length,
        jsResources: jsResources.length,
        totalJSSize: Math.round(totalJSSize / 1024)
      });
  }

  static reportLargeChunks(thresholdKB = 500) {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const largeChunks = resources
      .filter(resource => (resource as any).transferSize > thresholdKB * 1024)
      .map(resource => ({
        name: resource.name,
        size: Math.round(((resource as any).transferSize || 0) / 1024),
        duration: Math.round(resource.duration)
      }))
      .sort((a, b) => b.size - a.size);

    if (largeChunks.length > 0) {
      logger.warn('Large chunks detected - consider code splitting');
    }

    return largeChunks;
  }
}

// Tree shaking analysis (development only)
export function analyzeUnusedExports() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // This would require build-time analysis
  // For now, just provide a placeholder
  logger.info('Tree shaking analysis would run here in a real build pipeline');
  
  return {
    unusedExports: [],
    potentialSavings: 0,
    recommendations: [
      'Use named imports instead of default imports where possible',
      'Avoid importing entire libraries if only using specific functions',
      'Use dynamic imports for code that is conditionally loaded'
    ]
  };
}

// Initialize bundle optimization
export function initBundleOptimization() {
  // Start performance monitoring
  BundleAnalyzer.startAnalysis();

  // Report large chunks periodically
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      const stats = BundleAnalyzer.getLoadingStats();
      const largeChunks = BundleAnalyzer.reportLargeChunks();
      
      if (stats) {
        logger.info('Performance monitoring active');
      }
      
      if (largeChunks.length > 0) {
        logger.warn('Consider splitting large chunks for better performance');
      }
    }, 5000);
  }
}

// Export for global initialization
if (typeof window !== 'undefined') {
  // Auto-initialize on import
  setTimeout(initBundleOptimization, 1000);
}