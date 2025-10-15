import { useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VirtualScroll } from './virtual-list';
import { useIntelligentCache } from '@/hooks/useIntelligentCache';
import { cn } from '@/lib/utils';

interface KanbanItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: Date;
  tags?: string[];
}

interface KanbanColumn {
  id: string;
  title: string;
  items: KanbanItem[];
  color?: string;
  limit?: number;
}

interface OptimizedKanbanProps {
  columns: KanbanColumn[];
  onItemMove?: (itemId: string, fromColumn: string, toColumn: string) => void;
  onItemClick?: (item: KanbanItem) => void;
  renderItem?: (item: KanbanItem) => React.ReactNode;
  className?: string;
  virtualScrollHeight?: number;
  itemHeight?: number;
}

// Memoized Kanban Item Component
const KanbanItemComponent = memo(({ 
  item, 
  onClick, 
  renderCustom 
}: { 
  item: KanbanItem; 
  onClick?: (item: KanbanItem) => void;
  renderCustom?: (item: KanbanItem) => React.ReactNode;
}) => {
  const handleClick = useCallback(() => {
    onClick?.(item);
  }, [item, onClick]);

  if (renderCustom) {
    return <div onClick={handleClick}>{renderCustom(item)}</div>;
  }

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  return (
    <Card 
      className="mb-3 cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={handleClick}
    >
      <CardHeader className="pb-2 px-3 pt-3">
        <div className="flex items-start justify-between">
          <h4 className="text-sm font-medium truncate flex-1">{item.title}</h4>
          {item.priority && (
            <Badge 
              variant="outline" 
              className={cn('ml-2 text-xs', priorityColors[item.priority])}
            >
              {item.priority}
            </Badge>
          )}
        </div>
      </CardHeader>
      {(item.description || item.tags?.length || item.assignee || item.dueDate) && (
        <CardContent className="px-3 pb-3 pt-0">
          {item.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {item.description}
            </p>
          )}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {item.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{item.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {item.assignee && (
              <span className="truncate">{item.assignee}</span>
            )}
            {item.dueDate && (
              <span className="ml-auto">
                {new Date(item.dueDate).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
});

KanbanItemComponent.displayName = 'KanbanItemComponent';

// Memoized Kanban Column Component
const KanbanColumnComponent = memo(({ 
  column, 
  onItemMove, 
  onItemClick, 
  renderItem,
  virtualScrollHeight = 600,
  itemHeight = 120
}: { 
  column: KanbanColumn; 
  onItemMove?: (itemId: string, fromColumn: string, toColumn: string) => void;
  onItemClick?: (item: KanbanItem) => void;
  renderItem?: (item: KanbanItem) => React.ReactNode;
  virtualScrollHeight?: number;
  itemHeight?: number;
}) => {
  const renderKanbanItem = useCallback((item: KanbanItem, index: number, style: React.CSSProperties) => (
    <div key={item.id} style={style}>
      <KanbanItemComponent 
        item={item} 
        onClick={onItemClick}
        renderCustom={renderItem}
      />
    </div>
  ), [onItemClick, renderItem]);

  const isOverLimit = column.limit && column.items.length > column.limit;

  return (
    <div className="flex flex-col h-full min-w-80">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {column.items.length}
          </Badge>
          {column.limit && (
            <Badge 
              variant={isOverLimit ? "destructive" : "outline"} 
              className="text-xs"
            >
              /{column.limit}
            </Badge>
          )}
        </div>
        {column.color && (
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {column.items.length > 10 ? (
          <VirtualScroll
            items={column.items}
            height={virtualScrollHeight}
            itemHeight={itemHeight}
            renderItem={renderKanbanItem}
            className="pr-2"
          />
        ) : (
          <div className="space-y-3 pr-2 max-h-full overflow-y-auto">
            {column.items.map(item => (
              <KanbanItemComponent 
                key={item.id}
                item={item} 
                onClick={onItemClick}
                renderCustom={renderItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

KanbanColumnComponent.displayName = 'KanbanColumnComponent';

// Main Optimized Kanban Component
export const OptimizedKanban = memo<OptimizedKanbanProps>(({ 
  columns, 
  onItemMove, 
  onItemClick, 
  renderItem,
  className,
  virtualScrollHeight = 600,
  itemHeight = 120
}) => {
  // Memoize column processing for performance
  const processedColumns = useMemo(() => {
    return columns.map(column => ({
      ...column,
      items: column.items.sort((a, b) => {
        // Sort by priority, then by due date
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority || 'low'];
        const bPriority = priorityOrder[b.priority || 'low'];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        
        return a.title.localeCompare(b.title);
      })
    }));
  }, [columns]);

  // Calculate board statistics
  const stats = useMemo(() => {
    const totalItems = columns.reduce((sum, col) => sum + col.items.length, 0);
    const overLimitColumns = columns.filter(col => 
      col.limit && col.items.length > col.limit
    ).length;
    
    return { totalItems, overLimitColumns };
  }, [columns]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Board Stats */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          Total: {stats.totalItems} itens • 
          Colunas: {columns.length} • 
          {stats.overLimitColumns > 0 && (
            <span className="text-destructive">
              {stats.overLimitColumns} acima do limite
            </span>
          )}
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-6 p-4 min-h-full">
          {processedColumns.map(column => (
            <KanbanColumnComponent
              key={column.id}
              column={column}
              onItemMove={onItemMove}
              onItemClick={onItemClick}
              renderItem={renderItem}
              virtualScrollHeight={virtualScrollHeight}
              itemHeight={itemHeight}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

OptimizedKanban.displayName = 'OptimizedKanban';

// Hook for Kanban data management with caching
export function useOptimizedKanban(
  fetchData: () => Promise<KanbanColumn[]>,
  cacheKey: string = 'kanban-data'
) {
  const { data, loading, error, refetch } = useIntelligentCache(
    cacheKey,
    fetchData,
    {
      ttl: 2 * 60 * 1000, // 2 minutes
      staleWhileRevalidate: true,
      priority: 'high'
    }
  );

  const moveItem = useCallback(async (
    itemId: string, 
    fromColumn: string, 
    toColumn: string
  ) => {
    if (!data || fromColumn === toColumn) return;

    // Optimistic update
    const updatedColumns = data.map(column => {
      if (column.id === fromColumn) {
        return {
          ...column,
          items: column.items.filter(item => item.id !== itemId)
        };
      }
      if (column.id === toColumn) {
        const itemToMove = data
          .find(col => col.id === fromColumn)
          ?.items.find(item => item.id === itemId);
        
        if (itemToMove) {
          return {
            ...column,
            items: [...column.items, { ...itemToMove, status: toColumn }]
          };
        }
      }
      return column;
    });

    // Update cache immediately for better UX
    // In real implementation, also sync with backend
    return updatedColumns;
  }, [data]);

  return {
    columns: data || [],
    loading,
    error,
    refetch,
    moveItem
  };
}