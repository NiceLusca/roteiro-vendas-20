import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { throttle } from '@/utils/performance';

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number; // Number of extra items to render outside visible area
  onScroll?: (scrollTop: number) => void;
  scrollToIndex?: number;
}

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className,
  overscan = 5,
  onScroll,
  scrollToIndex
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const containerHeight = height;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, height, itemHeight, items.length, overscan]);

  // Throttled scroll handler
  const handleScroll = useCallback(
    throttle((e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    }, 16), // ~60fps
    [onScroll]
  );

  // Scroll to specific index
  useEffect(() => {
    if (scrollToIndex !== undefined && containerRef.current) {
      const targetScrollTop = scrollToIndex * itemHeight;
      containerRef.current.scrollTop = targetScrollTop;
      setScrollTop(targetScrollTop);
    }
  }, [scrollToIndex, itemHeight]);

  // Calculate total height and offset
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  // Render visible items
  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.startIndex; i < visibleRange.endIndex; i++) {
      if (i < items.length) {
        result.push({
          index: i,
          item: items[i],
          style: {
            position: 'absolute' as const,
            top: i * itemHeight,
            left: 0,
            right: 0,
            height: itemHeight,
          }
        });
      }
    }
    return result;
  }, [items, visibleRange, itemHeight]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'overflow-auto',
        className
      )}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div
        ref={contentRef}
        style={{
          position: 'relative',
          height: totalHeight,
        }}
      >
        {visibleItems.map(({ index, item, style }) => (
          <div key={index} style={style}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Optimized version for fixed-height items with better performance
interface VirtualScrollProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  className?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
}

export function VirtualScroll<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className,
  onEndReached,
  endReachedThreshold = 0.8
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isNearEnd = useRef(false);

  // Calculate visible items with buffer
  const { startIndex, endIndex, totalHeight } = useMemo(() => {
    const buffer = Math.max(5, Math.ceil(height / itemHeight / 2));
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const end = Math.min(items.length, Math.ceil((scrollTop + height) / itemHeight) + buffer);
    
    return {
      startIndex: start,
      endIndex: end,
      totalHeight: items.length * itemHeight
    };
  }, [scrollTop, height, itemHeight, items.length]);

  // Optimized scroll handler
  const handleScroll = useCallback(
    throttle((e: React.UIEvent<HTMLDivElement>) => {
      const element = e.currentTarget;
      const newScrollTop = element.scrollTop;
      
      setScrollTop(newScrollTop);

      // Check if near end for infinite loading
      const scrollPercentage = (newScrollTop + height) / totalHeight;
      
      if (scrollPercentage >= endReachedThreshold && !isNearEnd.current) {
        isNearEnd.current = true;
        onEndReached?.();
      } else if (scrollPercentage < endReachedThreshold) {
        isNearEnd.current = false;
      }
    }, 16),
    [height, totalHeight, endReachedThreshold, onEndReached]
  );

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto will-change-scroll', className)}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {Array.from({ length: endIndex - startIndex }, (_, i) => {
          const index = startIndex + i;
          const item = items[index];
          
          if (!item) return null;
          
          const style: React.CSSProperties = {
            position: 'absolute',
            top: index * itemHeight,
            left: 0,
            right: 0,
            height: itemHeight,
          };
          
          return renderItem(item, index, style);
        })}
      </div>
    </div>
  );
}