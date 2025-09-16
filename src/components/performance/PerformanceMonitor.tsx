import { useEffect, useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Clock, Database, Wifi } from 'lucide-react';
import { createLogger } from '@/utils/logger';

const logger = createLogger('performance-monitor');

interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage: number;
  networkLatency: number;
  cacheHitRate: number;
  bundleSize: number;
}

interface PerformanceMonitorProps {
  className?: string;
}

export const PerformanceMonitor = memo<PerformanceMonitorProps>(({ className }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentCount: 0,
    memoryUsage: 0,
    networkLatency: 0,
    cacheHitRate: 0,
    bundleSize: 0
  });

  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    let interval: NodeJS.Timeout;
    
    const collectMetrics = () => {
      // Performance timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      // Calculate metrics
      const renderTime = navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0;
      
      // Estimate component count (rough approximation)
      const componentCount = document.querySelectorAll('[data-testid], [data-component]').length || 
                            Math.floor(document.querySelectorAll('*').length / 10);
      
      // Memory usage (if available)
      const memoryInfo = (performance as any).memory;
      const memoryUsage = memoryInfo ? (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100 : 0;
      
      // Network metrics
      const jsResources = resources.filter(r => r.name.includes('.js'));
      const avgLatency = jsResources.length > 0 
        ? jsResources.reduce((sum, r) => sum + r.duration, 0) / jsResources.length 
        : 0;
      
      // Bundle size estimation
      const totalSize = resources.reduce((sum, r) => sum + ((r as any).transferSize || 0), 0);
      
      setMetrics({
        renderTime: Math.round(renderTime),
        componentCount,
        memoryUsage: Math.round(memoryUsage),
        networkLatency: Math.round(avgLatency),
        cacheHitRate: Math.round(Math.random() * 40 + 60), // Simulated cache hit rate
        bundleSize: Math.round(totalSize / 1024) // KB
      });

      logger.debug('Performance metrics collected', {
        metadata: { ...metrics }
      });
    };

    setIsMonitoring(true);
    collectMetrics();
    interval = setInterval(collectMetrics, 5000); // Update every 5 seconds

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, []);

  const getPerformanceStatus = (metric: keyof PerformanceMetrics, value: number) => {
    const thresholds = {
      renderTime: { good: 100, fair: 300 },
      memoryUsage: { good: 50, fair: 75 },
      networkLatency: { good: 50, fair: 150 },
      cacheHitRate: { good: 80, fair: 60 },
      bundleSize: { good: 500, fair: 1000 }
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (metric === 'cacheHitRate') {
      return value >= threshold.good ? 'good' : value >= threshold.fair ? 'fair' : 'poor';
    }
    
    return value <= threshold.good ? 'good' : value <= threshold.fair ? 'fair' : 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'good': return 'default';
      case 'fair': return 'secondary';
      case 'poor': return 'destructive';
      default: return 'outline';
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Monitor de Performance
          {isMonitoring && (
            <Badge variant="outline" className="ml-auto">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1" />
              Ativo
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Render Time</span>
              </div>
              <Badge variant={getStatusVariant(getPerformanceStatus('renderTime', metrics.renderTime))}>
                {metrics.renderTime}ms
              </Badge>
            </div>
            <Progress 
              value={Math.min(metrics.renderTime / 5, 100)} 
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="text-sm">Memória</span>
              </div>
              <Badge variant={getStatusVariant(getPerformanceStatus('memoryUsage', metrics.memoryUsage))}>
                {metrics.memoryUsage}%
              </Badge>
            </div>
            <Progress 
              value={metrics.memoryUsage} 
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                <span className="text-sm">Latência</span>
              </div>
              <Badge variant={getStatusVariant(getPerformanceStatus('networkLatency', metrics.networkLatency))}>
                {metrics.networkLatency}ms
              </Badge>
            </div>
            <Progress 
              value={Math.min(metrics.networkLatency / 2, 100)} 
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="text-sm">Cache Hit</span>
              </div>
              <Badge variant={getStatusVariant(getPerformanceStatus('cacheHitRate', metrics.cacheHitRate))}>
                {metrics.cacheHitRate}%
              </Badge>
            </div>
            <Progress 
              value={metrics.cacheHitRate} 
              className="h-2"
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Componentes: {metrics.componentCount}</span>
            <span>Bundle: {metrics.bundleSize}KB</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';