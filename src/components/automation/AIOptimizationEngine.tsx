import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { useSupabaseInteractions } from '@/hooks/useSupabaseInteractions';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Clock, 
  MessageSquare, 
  Zap,
  CheckCircle,
  AlertTriangle,
  Info,
  BarChart3,
  Lightbulb,
  Sparkles
} from 'lucide-react';

interface AIInsight {
  id: string;
  type: 'optimization' | 'pattern' | 'prediction' | 'alert';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  category: 'timing' | 'messaging' | 'workflow' | 'targeting';
  data?: Record<string, any>;
  recommendation?: string;
  implementable?: boolean;
}

interface OptimizationMetrics {
  conversionRate: number;
  responseRate: number;
  timeToClose: number;
  engagementScore: number;
  automationEfficiency: number;
  predictedImpact: number;
}

export function AIOptimizationEngine() {
  const { leads } = useSupabaseLeads();
  const { interactions } = useSupabaseInteractions();
  const { toast } = useToast();
  
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [metrics, setMetrics] = useState<OptimizationMetrics>({
    conversionRate: 24.5,
    responseRate: 67.8,
    timeToClose: 14.2,
    engagementScore: 78.3,
    automationEfficiency: 85.7,
    predictedImpact: 32.1
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const [optimizationProgress, setOptimizationProgress] = useState(0);

  useEffect(() => {
    generateAIInsights();
  }, [leads, interactions]);

  const generateAIInsights = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis progress
    for (let i = 0; i <= 100; i += 10) {
      setOptimizationProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Generate mock insights based on data patterns
    const newInsights: AIInsight[] = [
      {
        id: '1',
        type: 'optimization',
        title: 'Timing Ótimo para Follow-ups',
        description: 'Análise de 1.247 interações mostra que follow-ups enviados às terças-feiras às 14h têm 43% mais taxa de resposta.',
        impact: 'high',
        confidence: 0.87,
        actionable: true,
        category: 'timing',
        recommendation: 'Ajustar workflows para enviar follow-ups às terças-feiras às 14h',
        implementable: true,
        data: {
          bestDay: 'Tuesday',
          bestHour: 14,
          improvementPercentage: 43,
          dataPoints: 1247
        }
      },
      {
        id: '2',
        type: 'pattern',
        title: 'Padrão de Abandono Identificado',
        description: 'Leads que não respondem ao primeiro WhatsApp em 48h têm 78% de chance de não converter.',
        impact: 'high',
        confidence: 0.92,
        actionable: true,
        category: 'messaging',
        recommendation: 'Implementar sequência de re-engajamento após 48h de inatividade',
        implementable: true,
        data: {
          timeThreshold: 48,
          conversionDrop: 78,
          alternativeChannels: ['email', 'phone']
        }
      },
      {
        id: '3',
        type: 'prediction',
        title: 'Leads de Alto Potencial',
        description: 'Modelo preditivo identifica 23 leads com 85%+ probabilidade de conversão nas próximas 2 semanas.',
        impact: 'medium',
        confidence: 0.85,
        actionable: true,
        category: 'targeting',
        recommendation: 'Priorizar atenção personalizada para estes leads',
        implementable: false,
        data: {
          leadCount: 23,
          conversionProbability: 0.85,
          timeframe: 14
        }
      },
      {
        id: '4',
        type: 'alert',
        title: 'Queda no Engajamento',
        description: 'Taxa de engajamento caiu 12% nos últimos 7 dias. Possível causa: mudança no algoritmo do WhatsApp.',
        impact: 'medium',
        confidence: 0.73,
        actionable: true,
        category: 'messaging',
        recommendation: 'Diversificar canais de comunicação e ajustar frequência de mensagens',
        implementable: true,
        data: {
          engagementDrop: 12,
          timeframe: 7,
          possibleCause: 'algorithm_change'
        }
      },
      {
        id: '5',
        type: 'optimization',
        title: 'Oportunidade de Cross-sell',
        description: 'Clientes que compraram produto A têm 65% de interesse em produto B quando ofertado entre 30-45 dias.',
        impact: 'medium',
        confidence: 0.79,
        actionable: true,
        category: 'workflow',
        recommendation: 'Criar workflow de cross-sell automatizado',
        implementable: true,
        data: {
          crossSellRate: 65,
          optimalTiming: { min: 30, max: 45 },
          products: { primary: 'A', secondary: 'B' }
        }
      }
    ];

    setInsights(newInsights);
    setLastAnalysis(new Date());
    setIsAnalyzing(false);
    setOptimizationProgress(0);

    toast({
      title: "Análise IA Concluída",
      description: `${newInsights.length} insights gerados com base nos dados atuais.`
    });
  };

  const implementInsight = async (insightId: string) => {
    const insight = insights.find(i => i.id === insightId);
    if (!insight || !insight.implementable) return;

    // Simulate implementation
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Otimização Implementada",
      description: `"${insight.title}" foi implementado com sucesso.`
    });

    // Update insight status
    setInsights(prev => prev.map(i => 
      i.id === insightId 
        ? { ...i, actionable: false }
        : i
    ));
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'optimization': return TrendingUp;
      case 'pattern': return Target;
      case 'prediction': return Brain;
      case 'alert': return AlertTriangle;
      default: return Info;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'timing': return Clock;
      case 'messaging': return MessageSquare;
      case 'workflow': return Zap;
      case 'targeting': return Target;
      default: return Lightbulb;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Engine de Otimização IA</h2>
          <p className="text-muted-foreground">
            Análise inteligente e otimizações automáticas baseadas em dados
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={generateAIInsights}
            disabled={isAnalyzing}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analisando...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Executar Análise IA
              </>
            )}
          </Button>
        </div>
      </div>

      {isAnalyzing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
                <p className="font-medium">Analisando padrões com IA...</p>
              </div>
              <Progress value={optimizationProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Processando {leads.length} leads e {interactions.length} interações
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">Insights IA</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {insights.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Nenhum insight disponível</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Execute uma análise IA para gerar insights personalizados
                  </p>
                  <Button onClick={generateAIInsights}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar Insights
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {insights.map(insight => {
                const InsightIcon = getInsightIcon(insight.type);
                const CategoryIcon = getCategoryIcon(insight.category);
                
                return (
                  <Card key={insight.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <InsightIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{insight.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground capitalize">
                                {insight.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getImpactColor(insight.impact)}>
                            {insight.impact}
                          </Badge>
                          <Badge variant="outline">
                            {Math.round(insight.confidence * 100)}% confiança
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">
                        {insight.description}
                      </p>
                      
                      {insight.recommendation && (
                        <Alert>
                          <Lightbulb className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Recomendação:</strong> {insight.recommendation}
                          </AlertDescription>
                        </Alert>
                      )}

                      {insight.actionable && (
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4" />
                            Insight acionável
                          </div>
                          {insight.implementable && (
                            <Button
                              size="sm"
                              onClick={() => implementInsight(insight.id)}
                            >
                              <Zap className="h-4 w-4 mr-2" />
                              Implementar
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Taxa de Conversão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {metrics.conversionRate}%
                </div>
                <p className="text-sm text-muted-foreground">
                  +2.3% vs. mês anterior
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Taxa de Resposta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {metrics.responseRate}%
                </div>
                <p className="text-sm text-muted-foreground">
                  -1.2% vs. semana anterior
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tempo p/ Fechamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">
                  {metrics.timeToClose} dias
                </div>
                <p className="text-sm text-muted-foreground">
                  -0.8 dias vs. mês anterior
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Score de Engajamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Atual</span>
                  <span className="text-2xl font-bold">{metrics.engagementScore}</span>
                </div>
                <Progress value={metrics.engagementScore} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Baseado em abertura, cliques e respostas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Eficiência da Automação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Atual</span>
                  <span className="text-2xl font-bold">{metrics.automationEfficiency}%</span>
                </div>
                <Progress value={metrics.automationEfficiency} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Taxa de sucesso das automações ativas
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Otimização de Performance</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  Com base na análise atual, implementar as seguintes otimizações pode aumentar a conversão em até {metrics.predictedImpact}%:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Ajustar timing de follow-ups para terças-feiras às 14h
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Implementar re-engajamento após 48h de inatividade
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Priorizar leads de alto potencial identificados pela IA
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-lg">Ações Urgentes</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  Questões que requerem atenção imediata:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    Investigar queda de 12% no engajamento
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    Diversificar canais além do WhatsApp
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {lastAnalysis && (
            <p className="text-sm text-muted-foreground">
              Última análise: {lastAnalysis.toLocaleString()}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}