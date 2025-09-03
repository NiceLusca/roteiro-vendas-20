import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  Lightbulb,
  Zap,
  Users,
  Clock,
  BarChart3
} from 'lucide-react';

interface AIInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'prediction' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  data?: Record<string, any>;
  createdAt: Date;
}

interface AIInsightCardsProps {
  pipelineId: string;
  limit?: number;
}

export function AIInsightCards({ pipelineId, limit = 6 }: AIInsightCardsProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular geração de insights baseados em IA
    const generateInsights = () => {
      setIsLoading(true);
      
      // Simular delay de processamento de IA
      setTimeout(() => {
        const mockInsights: AIInsight[] = [
          {
            id: '1',
            type: 'opportunity',
            title: 'Oportunidade de Cross-sell',
            description: 'Identificados 8 clientes com perfil ideal para produto complementar',
            confidence: 87,
            impact: 'high',
            actionable: true,
            data: { potential_revenue: 45000, client_count: 8 },
            createdAt: new Date(Date.now() - 3600000)
          },
          {
            id: '2',
            type: 'warning',
            title: 'Risco de Churn Elevado',
            description: 'Padrão de baixa engagement detectado em 5 leads de alto valor',
            confidence: 92,
            impact: 'high',
            actionable: true,
            data: { at_risk_leads: 5, total_value: 125000 },
            createdAt: new Date(Date.now() - 7200000)
          },
          {
            id: '3',
            type: 'prediction',
            title: 'Pico de Conversões Previsto',
            description: 'Modelo prevê aumento de 34% nas conversões nos próximos 7 dias',
            confidence: 78,
            impact: 'medium',
            actionable: false,
            data: { predicted_increase: 34, period_days: 7 },
            createdAt: new Date(Date.now() - 10800000)
          },
          {
            id: '4',
            type: 'optimization',
            title: 'Gargalo Identificado',
            description: 'Etapa "Proposta" acumula 67% dos leads com tempo 2x maior que o ideal',
            confidence: 95,
            impact: 'high',
            actionable: true,
            data: { stage_name: 'Proposta', bottleneck_percentage: 67 },
            createdAt: new Date(Date.now() - 14400000)
          },
          {
            id: '5',
            type: 'opportunity',
            title: 'Momento Ideal para Follow-up',
            description: 'IA detectou janela de alta receptividade em 12 leads dormentes',
            confidence: 81,
            impact: 'medium',
            actionable: true,
            data: { dormant_leads: 12, optimal_window: '14h-16h' },
            createdAt: new Date(Date.now() - 18000000)
          },
          {
            id: '6',
            type: 'prediction',
            title: 'Score Dinâmico Atualizado',
            description: 'Recalibração automática do modelo de scoring com base em novos padrões',
            confidence: 89,
            impact: 'medium',
            actionable: false,
            data: { leads_affected: 23, accuracy_improvement: 12 },
            createdAt: new Date(Date.now() - 21600000)
          }
        ];

        setInsights(mockInsights.slice(0, limit));
        setIsLoading(false);
      }, 1500);
    };

    generateInsights();
  }, [pipelineId, limit]);

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'opportunity': return Target;
      case 'warning': return AlertTriangle;
      case 'prediction': return TrendingUp;
      case 'optimization': return Zap;
      default: return Brain;
    }
  };

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'opportunity': return 'text-success';
      case 'warning': return 'text-destructive';
      case 'prediction': return 'text-primary';
      case 'optimization': return 'text-secondary';
      default: return 'text-muted-foreground';
    }
  };

  const getImpactBadge = (impact: AIInsight['impact']) => {
    switch (impact) {
      case 'high': return { variant: 'destructive' as const, label: 'Alto Impacto' };
      case 'medium': return { variant: 'default' as const, label: 'Médio Impacto' };
      case 'low': return { variant: 'secondary' as const, label: 'Baixo Impacto' };
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Agora há pouco';
    if (diffHours === 1) return 'Há 1 hora';
    if (diffHours < 24) return `Há ${diffHours} horas`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Há 1 dia';
    return `Há ${diffDays} dias`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: limit }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-lg" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
                <div className="h-6 bg-muted rounded w-1/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Insights de IA</h3>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          IA Ativa
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map(insight => {
          const Icon = getInsightIcon(insight.type);
          const impactBadge = getImpactBadge(insight.impact);
          
          return (
            <Card 
              key={insight.id} 
              className="hover:shadow-lg transition-all duration-300 relative overflow-hidden group"
            >
              {/* Gradient overlay based on type */}
              <div className={`absolute inset-0 opacity-5 ${
                insight.type === 'opportunity' ? 'bg-gradient-to-br from-success to-success' :
                insight.type === 'warning' ? 'bg-gradient-to-br from-destructive to-destructive' :
                insight.type === 'prediction' ? 'bg-gradient-to-br from-primary to-primary' :
                'bg-gradient-to-br from-secondary to-secondary'
              }`} />
              
              <CardHeader className="pb-3 relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      insight.type === 'opportunity' ? 'bg-success/10' :
                      insight.type === 'warning' ? 'bg-destructive/10' :
                      insight.type === 'prediction' ? 'bg-primary/10' :
                      'bg-secondary/10'
                    }`}>
                      <Icon className={`h-4 w-4 ${getInsightColor(insight.type)}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium leading-tight">
                        {insight.title}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(insight.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={impactBadge.variant} className="text-xs">
                    {impactBadge.label}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="relative space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {insight.description}
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Confiança da IA</span>
                    <span className="font-medium">{insight.confidence}%</span>
                  </div>
                  <Progress value={insight.confidence} className="h-1.5" />
                </div>
                
                {insight.data && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(insight.data).slice(0, 2).map(([key, value]) => (
                      <div key={key} className="p-2 rounded bg-muted/50">
                        <div className="font-medium capitalize">
                          {key.replace('_', ' ')}
                        </div>
                        <div className="text-muted-foreground">
                          {typeof value === 'number' && value > 1000 
                            ? `R$ ${(value / 1000).toFixed(0)}k`
                            : value
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {insight.actionable && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Agir sobre Insight
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {insights.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                A IA está processando dados para gerar insights...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}