import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PredictiveAnalytics } from './PredictiveAnalytics';
import { SmartWorkflowAutomation } from './SmartWorkflowAutomation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  Bot, 
  Target, 
  Clock,
  Users,
  ArrowUp,
  ArrowDown,
  Activity,
  AlertTriangle
} from 'lucide-react';

interface IntelligenceMetric {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  description: string;
  icon: React.ComponentType<any>;
}

export function IntelligentDashboard() {
  const { pipelines, loading } = useSupabasePipelines();
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [intelligenceMetrics, setIntelligenceMetrics] = useState<IntelligenceMetric[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Initialize selected pipeline
  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipelineId) {
      const primaryPipeline = pipelines.find(p => p.primary_pipeline && p.ativo);
      const defaultPipeline = primaryPipeline || pipelines.find(p => p.ativo) || pipelines[0];
      if (defaultPipeline) {
        setSelectedPipelineId(defaultPipeline.id);
      }
    }
  }, [pipelines, selectedPipelineId]);

  // Generate intelligence metrics
  useEffect(() => {
    if (selectedPipelineId) {
      const metrics: IntelligenceMetric[] = [
        {
          title: 'Taxa de Conversão IA',
          value: '87.3%',
          change: 12.5,
          trend: 'up',
          description: 'Previsão baseada em padrões históricos',
          icon: Target
        },
        {
          title: 'Automações Ativas',
          value: 23,
          change: 8.2,
          trend: 'up',
          description: 'Workflows inteligentes em execução',
          icon: Zap
        },
        {
          title: 'Score Médio Preditivo',
          value: 74.2,
          change: -3.1,
          trend: 'down',
          description: 'Score médio dos leads no pipeline',
          icon: Brain
        },
        {
          title: 'Tempo Médio Otimizado',
          value: '12.4 dias',
          change: -18.7,
          trend: 'up',
          description: 'Redução através de automações',
          icon: Clock
        },
        {
          title: 'Leads em Risco',
          value: 8,
          change: -25.0,
          trend: 'up',
          description: 'Identificados por análise preditiva',
          icon: AlertTriangle
        },
        {
          title: 'ROI de Automação',
          value: '245%',
          change: 34.2,
          trend: 'up',
          description: 'Retorno sobre automações implementadas',
          icon: TrendingUp
        }
      ];
      
      setIntelligenceMetrics(metrics);
    }
  }, [selectedPipelineId]);

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-success" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-destructive" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral', change: number) => {
    if (trend === 'neutral') return 'text-muted-foreground';
    
    // Para métricas onde diminuição é boa (tempo, leads em risco)
    const isDecreaseBetter = change < 0 && trend === 'up';
    if (isDecreaseBetter) return 'text-success';
    
    return change > 0 ? 'text-success' : 'text-destructive';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Inteligência de Pipeline
          </h1>
          <p className="text-muted-foreground">
            Análises preditivas e automações inteligentes para maximizar performance
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecione um pipeline" />
            </SelectTrigger>
            <SelectContent>
              {pipelines.map(pipeline => (
                <SelectItem key={pipeline.id} value={pipeline.id}>
                  <div className="flex items-center gap-2">
                    <span>{pipeline.nome}</span>
                    {pipeline.primary_pipeline && (
                      <Badge variant="outline" className="text-xs">Primário</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Análise Preditiva
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Automação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Métricas de Inteligência */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {intelligenceMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <CardTitle className="text-sm font-medium">
                          {metric.title}
                        </CardTitle>
                      </div>
                      {getTrendIcon(metric.trend)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-foreground">
                        {metric.value}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getTrendColor(metric.trend, metric.change)}`}>
                          {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                        </span>
                        <span className="text-sm text-muted-foreground">vs mês anterior</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {metric.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Insights Rápidos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <CardTitle>Insights Inteligentes</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                    <div className="p-1 rounded bg-success/10">
                      <Target className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Alta Probabilidade de Conversão</p>
                      <p className="text-xs text-muted-foreground">
                        12 leads identificados com mais de 90% de chance de fechamento
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                    <div className="p-1 rounded bg-warning/10">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Gargalo Detectado</p>
                      <p className="text-xs text-muted-foreground">
                        Etapa "Qualificação" com tempo médio 45% acima do ideal
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                    <div className="p-1 rounded bg-primary/10">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Automação Sugerida</p>
                      <p className="text-xs text-muted-foreground">
                        Follow-up automático pode aumentar conversão em 23%
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full" onClick={() => setActiveTab('predictive')}>
                  Ver Análise Completa
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/5 to-primary/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-secondary" />
                  <CardTitle>Status das Automações</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <div className="text-2xl font-bold text-success">23</div>
                    <p className="text-xs text-muted-foreground">Ativas</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <div className="text-2xl font-bold text-primary">89.2%</div>
                    <p className="text-xs text-muted-foreground">Taxa de Sucesso</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Follow-up Automático</span>
                    <Badge variant="default">Ativa</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Qualificação Inteligente</span>
                    <Badge variant="default">Ativa</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Agendamento Auto</span>
                    <Badge variant="secondary">Pausada</Badge>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full" onClick={() => setActiveTab('automation')}>
                  Gerenciar Automações
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictive">
          {selectedPipelineId && (
            <PredictiveAnalytics pipelineId={selectedPipelineId} />
          )}
        </TabsContent>

        <TabsContent value="automation">
          {selectedPipelineId && (
            <SmartWorkflowAutomation pipelineId={selectedPipelineId} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}