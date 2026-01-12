import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataFreshnessIndicatorProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  isRefreshing?: boolean;
  className?: string;
  staleThresholdMinutes?: number; // Threshold to show warning (default: 5 min)
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 10) {
    return 'agora';
  } else if (diffSecs < 60) {
    return `${diffSecs}s atrás`;
  } else if (diffMins < 60) {
    return `${diffMins}min atrás`;
  } else if (diffHours < 24) {
    return `${diffHours}h atrás`;
  } else {
    return date.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export function DataFreshnessIndicator({
  lastUpdated,
  onRefresh,
  isRefreshing = false,
  className,
  staleThresholdMinutes = 5
}: DataFreshnessIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    if (!lastUpdated) return;

    const updateTimeAgo = () => {
      setTimeAgo(getTimeAgo(lastUpdated));
      
      const diffMs = new Date().getTime() - lastUpdated.getTime();
      const diffMins = Math.floor(diffMs / 1000 / 60);
      setIsStale(diffMins >= staleThresholdMinutes);
    };

    updateTimeAgo();
    
    // Update every 10 seconds
    const interval = setInterval(updateTimeAgo, 10000);
    return () => clearInterval(interval);
  }, [lastUpdated, staleThresholdMinutes]);

  if (!lastUpdated) {
    return null;
  }

  const StatusIcon = isStale ? AlertTriangle : CheckCircle2;

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1.5", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors",
                isStale 
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isStale ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">Atualizado {timeAgo}</span>
              <span className="sm:hidden">{timeAgo}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>
              Última atualização: {lastUpdated.toLocaleString('pt-BR')}
              {isStale && (
                <span className="block text-yellow-500 mt-1">
                  Dados podem estar desatualizados. Clique para atualizar.
                </span>
              )}
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className={cn(
                "h-7 w-7 p-0",
                isStale && "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100"
              )}
            >
              <RefreshCw 
                className={cn(
                  "h-3.5 w-3.5",
                  isRefreshing && "animate-spin"
                )} 
              />
              <span className="sr-only">Atualizar dados</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Atualizar dados agora</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
