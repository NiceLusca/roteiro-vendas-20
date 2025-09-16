import { PerformanceMonitor } from '@/components/performance/PerformanceMonitor';
import { BundleAnalyzer } from '@/utils/bundleOptimization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Performance() {
  const [bundleStats, setBundleStats] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Initial analysis
    analyzeBundlePerformance();
  }, []);

  const analyzeBundlePerformance = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const largeChunks = BundleAnalyzer.reportLargeChunks(200); // 200KB threshold
      setBundleStats(largeChunks);
      setIsAnalyzing(false);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance & UX</h1>
          <p className="text-muted-foreground">
            Monitore o desempenho da aplicação e otimizações de bundle
          </p>
        </div>
        
        <Button 
          onClick={analyzeBundlePerformance}
          disabled={isAnalyzing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          Analisar
        </Button>
      </div>

      {/* Real-time Performance Monitor */}
      <PerformanceMonitor />

      {/* Bundle Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Análise de Bundle
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bundleStats.length > 0 ? (
              <div className="space-y-3">
                {bundleStats.map((chunk, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {chunk.name.split('/').pop()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Carregamento: {chunk.duration}ms
                      </p>
                    </div>
                    <Badge variant={chunk.size > 1000 ? 'destructive' : 'secondary'}>
                      {chunk.size}KB
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum chunk grande detectado</p>
                <p className="text-xs">Performance otimizada!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Otimizações Aplicadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Virtual Scrolling</span>
                <Badge variant="default">✓ Ativo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Intelligent Caching</span>
                <Badge variant="default">✓ Ativo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Progressive Loading</span>
                <Badge variant="default">✓ Ativo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Lazy Components</span>
                <Badge variant="default">✓ Ativo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Bundle Optimization</span>
                <Badge variant="default">✓ Ativo</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Dicas de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Componentes Lazy</h4>
              <p className="text-sm text-muted-foreground">
                Use lazy loading para componentes pesados que não são necessários na renderização inicial.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Memoização Inteligente</h4>
              <p className="text-sm text-muted-foreground">
                Aplique React.memo e useMemo estrategicamente para evitar re-renderizações desnecessárias.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Cache Otimizado</h4>
              <p className="text-sm text-muted-foreground">
                Use o sistema de cache inteligente para dados que não mudam frequentemente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}