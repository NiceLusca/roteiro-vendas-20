import { useMemo, useRef, useCallback } from 'react';
import { debounce } from '@/utils/performance';

// Deep equality check for complex objects
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return a === b;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}

// Smart memoization that handles deep objects
export function useDeepMemo<T>(factory: () => T, deps: React.DependencyList): T {
  const ref = useRef<{ deps: React.DependencyList; value: T } | undefined>();
  
  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = {
      deps: [...deps],
      value: factory()
    };
  }
  
  return ref.current.value;
}

// Memoized callback with debouncing
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  return useCallback(
    debounce((...args: Parameters<T>) => {
      return callbackRef.current(...args);
    }, delay),
    deps
  ) as T;
}

// Memoized search function with intelligent filtering
export function useSearchMemo<T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  options: {
    caseSensitive?: boolean;
    fuzzyMatch?: boolean;
    minLength?: number;
  } = {}
) {
  const { caseSensitive = false, fuzzyMatch = false, minLength = 1 } = options;
  
  return useMemo(() => {
    if (!searchTerm || searchTerm.length < minLength) {
      return items;
    }
    
    const searchValue = caseSensitive ? searchTerm : searchTerm.toLowerCase();
    
    return items.filter(item => {
      return searchFields.some(field => {
        const fieldValue = item[field];
        if (fieldValue == null) return false;
        
        const stringValue = caseSensitive 
          ? String(fieldValue) 
          : String(fieldValue).toLowerCase();
        
        if (fuzzyMatch) {
          // Simple fuzzy matching - checks if all characters exist in order
          let searchIndex = 0;
          for (let i = 0; i < stringValue.length && searchIndex < searchValue.length; i++) {
            if (stringValue[i] === searchValue[searchIndex]) {
              searchIndex++;
            }
          }
          return searchIndex === searchValue.length;
        }
        
        return stringValue.includes(searchValue);
      });
    });
  }, [items, searchTerm, searchFields, caseSensitive, fuzzyMatch, minLength]);
}

// Memoized sorting with multiple criteria
export function useSortMemo<T>(
  items: T[],
  sortConfig: {
    field: keyof T;
    direction: 'asc' | 'desc';
    type?: 'string' | 'number' | 'date';
  }[]
) {
  return useMemo(() => {
    if (!sortConfig.length) return [...items];
    
    return [...items].sort((a, b) => {
      for (const { field, direction, type = 'string' } of sortConfig) {
        const aValue = a[field];
        const bValue = b[field];
        
        let comparison = 0;
        
        if (type === 'number') {
          comparison = (Number(aValue) || 0) - (Number(bValue) || 0);
        } else if (type === 'date') {
          const aDate = new Date(aValue as any);
          const bDate = new Date(bValue as any);
          comparison = aDate.getTime() - bDate.getTime();
        } else {
          // String comparison
          const aStr = String(aValue || '');
          const bStr = String(bValue || '');
          comparison = aStr.localeCompare(bStr);
        }
        
        if (comparison !== 0) {
          return direction === 'desc' ? -comparison : comparison;
        }
      }
      
      return 0;
    });
  }, [items, sortConfig]);
}

// Memoized pagination
export function usePaginationMemo<T>(
  items: T[],
  page: number,
  pageSize: number
) {
  return useDeepMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      items: items.slice(startIndex, endIndex),
      totalItems: items.length,
      totalPages: Math.ceil(items.length / pageSize),
      currentPage: page,
      hasNext: endIndex < items.length,
      hasPrevious: startIndex > 0,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, items.length)
    };
  }, [items, page, pageSize]);
}

// Memoized grouping
export function useGroupMemo<T, K extends string | number>(
  items: T[],
  groupBy: (item: T) => K
) {
  return useMemo(() => {
    const groups = new Map<K, T[]>();
    
    items.forEach(item => {
      const key = groupBy(item);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });
    
    return groups;
  }, [items, groupBy]);
}

// Optimized list operations
export function useListOperations<T>(
  items: T[],
  keyExtractor: (item: T, index: number) => string | number = (_, index) => index
) {
  const keyMap = useMemo(() => {
    const map = new Map<string | number, number>();
    items.forEach((item, index) => {
      map.set(keyExtractor(item, index), index);
    });
    return map;
  }, [items, keyExtractor]);
  
  const operations = useMemo(() => ({
    findIndex: (key: string | number) => keyMap.get(key) ?? -1,
    
    findItem: (key: string | number) => {
      const index = keyMap.get(key);
      return index !== undefined ? items[index] : undefined;
    },
    
    hasItem: (key: string | number) => keyMap.has(key),
    
    getKeys: () => Array.from(keyMap.keys()),
    
    batch: <R>(operations: ((item: T, index: number) => R)[]) => {
      return items.map((item, index) => 
        operations.map(op => op(item, index))
      );
    }
  }), [items, keyMap]);
  
  return operations;
}

// Memoized filtering with performance tracking
export function useSmartFilter<T>(
  items: T[],
  filters: Array<{
    field: keyof T;
    operator: 'equals' | 'contains' | 'startsWith' | 'gt' | 'lt' | 'between';
    value: any;
    value2?: any; // For 'between' operator
  }>,
  options: {
    logPerformance?: boolean;
  } = {}
) {
  return useMemo(() => {
    const start = performance.now();
    
    const filtered = items.filter(item => {
      return filters.every(filter => {
        const fieldValue = item[filter.field];
        
        switch (filter.operator) {
          case 'equals':
            return fieldValue === filter.value;
          case 'contains':
            return String(fieldValue || '').toLowerCase().includes(String(filter.value || '').toLowerCase());
          case 'startsWith':
            return String(fieldValue || '').toLowerCase().startsWith(String(filter.value || '').toLowerCase());
          case 'gt':
            return Number(fieldValue) > Number(filter.value);
          case 'lt':
            return Number(fieldValue) < Number(filter.value);
          case 'between':
            const numValue = Number(fieldValue);
            return numValue >= Number(filter.value) && numValue <= Number(filter.value2);
          default:
            return true;
        }
      });
    });
    
    if (options.logPerformance && process.env.NODE_ENV === 'development') {
      const duration = performance.now() - start;
      console.log(`Filter operation took ${duration.toFixed(2)}ms for ${items.length} items -> ${filtered.length} results`);
    }
    
    return filtered;
  }, [items, filters, options.logPerformance]);
}