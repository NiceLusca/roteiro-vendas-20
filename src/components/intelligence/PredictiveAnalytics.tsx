import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabaseLeadPipelineEntries } from '@/hooks/useSupabaseLeadPipelineEntries';
import { useSupabasePipelineStages } from '@/hooks/useSupabasePipelineStages';
import { TrendingUp, TrendingDown, Brain, Target, Clock, AlertTriangle, Zap, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PredictiveInsight {
  type: 'conversion' | 'bottleneck' | 'churn_risk' | 'opportunity';
  score: number;
  title: string;
  description: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
}

interface ConversionPrediction {
  leadId: string;
  leadName: string;
  currentStage: string;
  conversionProbability: number;
  daysToClose: number;
  bottleneckStage?: string;
  riskFactors: string[];
  recommendations: string[];
}

export function PredictiveAnalytics({ pipelineId }: { pipelineId: string }) {
  const { entries } = useSupabaseLeadPipelineEntries(pipelineId);
  const { stages } = useSupabasePipelineStages(pipelineId);
  const { toast } = useToast();
  
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [predictions, setPredictions] = useState<ConversionPrediction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  // AI-powered predictive analysis
  const generatePredictiveInsights = async () => {
    setIsAnalyzing(true);
    
    try {
      // Simular análise preditiva baseada em dados históricos
      const activeEntries = entries.filter(e => e.status_inscricao === 'Ativo');
      const leadsWithData = activeEntries.map(entry => {
        const lead = entry.leads; // Use JOIN data
        const currentStage = stages.find(s => s.id === entry.etapa_atual_id);
        return { entry, lead, currentStage };
      }).filter(item => item.lead && item.currentStage);

      // Análise de padrões de conversão
      const conversionAnalysis = analyzeConversionPatterns(leadsWithData);
      
      // Identificação de gargalos
      const bottleneckAnalysis = identifyBottlenecks(leadsWithData);
      
      // Previsão de churn
      const churnAnalysis = predictChurnRisk(leadsWithData);
      
      // Identificação de oportunidades
      const opportunityAnalysis = identifyOpportunities(leadsWithData);

      const newInsights: PredictiveInsight[] = [
        ...conversionAnalysis,
        ...bottleneckAnalysis,
        ...churnAnalysis,
        ...opportunityAnalysis
      ];

      // Gerar previsões individuais
      const newPredictions = leadsWithData.map(({ entry, lead, currentStage }) => 
        generateLeadPrediction(entry, lead!, currentStage!, leadsWithData)
      );

      setInsights(newInsights);
      setPredictions(newPredictions);
      setLastAnalysis(new Date());
      
      toast({
        title: "Análise Preditiva Concluída",
        description: `${newInsights.length} insights identificados para otimização do pipeline.`
      });
      
    } catch (error) {
      console.error('Erro na análise preditiva:', error);
      toast({
        title: "Erro na Análise",
        description: "Não foi possível completar a análise preditiva.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Análise de padrões de conversão
  const analyzeConversionPatterns = (leadsData: any[]): PredictiveInsight[] => {
    const insights: PredictiveInsight[] = [];
    
    // Calcular taxa de conversão por estágio
    const stageConversionRates = stages.map(stage => {
      const leadsInStage = leadsData.filter(l => l.entry.etapa_atual_id === stage.id);
      const avgTimeInStage = leadsInStage.reduce((acc, l) => acc + l.entry.tempo_em_etapa_dias, 0) / leadsInStage.length || 0;
      
      return {
        stage,
        count: leadsInStage.length,
        avgTime: avgTimeInStage,
        conversionRate: Math.max(20, 95 - (avgTimeInStage * 2)) // Simulação baseada em tempo
      };
    });

    // Identificar estágios com baixa conversão
    const lowConversionStages = stageConversionRates.filter(s => s.conversionRate < 60);
    
    if (lowConversionStages.length > 0) {
      insights.push({
        type: 'conversion',
        score: 85,
        title: 'Oportunidade de Melhoria na Conversão',
        description: `${lowConversionStages.length} estágios com taxa de conversão abaixo de 60%`,
        recommendation: 'Revisar critérios de avanço e implementar ações de melhoria nos estágios identificados',
        priority: 'high',
        impact: 'high'
      });
    }

    return insights;
  };

  // Identificação de gargalos
  const identifyBottlenecks = (leadsData: any[]): PredictiveInsight[] => {
    const insights: PredictiveInsight[] = [];
    
    const stageLoads = stages.map(stage => {
      const leadsInStage = leadsData.filter(l => l.entry.etapa_atual_id === stage.id);
      const overdue = leadsInStage.filter(l => l.entry.dias_em_atraso > 0);
      
      return {
        stage,
        totalLeads: leadsInStage.length,
        overdueLeads: overdue.length,
        overduePercentage: leadsInStage.length > 0 ? (overdue.length / leadsInStage.length) * 100 : 0,
        avgTime: leadsInStage.reduce((acc, l) => acc + l.entry.tempo_em_etapa_dias, 0) / leadsInStage.length || 0
      };
    });

    // Identificar gargalos por alta concentração de leads
    const bottlenecks = stageLoads.filter(s => s.totalLeads > 5 && s.overduePercentage > 40);
    
    if (bottlenecks.length > 0) {
      insights.push({
        type: 'bottleneck',
        score: 90,
        title: 'Gargalos Identificados no Pipeline',
        description: `${bottlenecks.length} estágios com acúmulo excessivo de leads`,
        recommendation: 'Implementar automações ou redistribuir responsabilidades nos estágios congestionados',
        priority: 'high',
        impact: 'high'
      });
    }

    return insights;
  };

  // Previsão de risco de churn
  const predictChurnRisk = (leadsData: any[]): PredictiveInsight[] => {
    const insights: PredictiveInsight[] = [];
    
    const highRiskLeads = leadsData.filter(({ entry, lead }) => {
      const riskScore = calculateChurnRisk(entry, lead!);
      return riskScore > 70;
    });

    if (highRiskLeads.length > 0) {
      insights.push({
        type: 'churn_risk',
        score: 75,
        title: 'Leads em Risco de Churn',
        description: `${highRiskLeads.length} leads com alta probabilidade de abandono`,
        recommendation: 'Implementar ações de retenção e follow-up personalizado para leads de alto risco',
        priority: 'high',
        impact: 'medium'
      });
    }

    return insights;
  };

  // Identificação de oportunidades
  const identifyOpportunities = (leadsData: any[]): PredictiveInsight[] => {
    const insights: PredictiveInsight[] = [];
    
    const highValueLeads = leadsData.filter(({ lead }) => 
      lead && lead.lead_score > 80 && lead.lead_score_classification === 'Alto'
    );

    if (highValueLeads.length > 0) {
      insights.push({
        type: 'opportunity',
        score: 88,
        title: 'Oportunidades de Alto Valor',
        description: `${highValueLeads.length} leads de alto valor potencial identificados`,
        recommendation: 'Priorizar atenção e recursos para leads de alto score para maximizar conversões',
        priority: 'medium',
        impact: 'high'
      });
    }

    return insights;
  };

  // Gerar previsão individual para um lead
  const generateLeadPrediction = (entry: any, lead: any, currentStage: any, allData: any[]): ConversionPrediction => {
    const conversionProbability = Math.max(10, Math.min(95, 
      lead.lead_score + (100 - entry.tempo_em_etapa_dias * 2) - entry.dias_em_atraso * 5
    ));
    
    const daysToClose = Math.max(1, currentStage.prazo_em_dias - entry.tempo_em_etapa_dias + 
      (stages.length - currentStage.ordem) * 5);
    
    const riskFactors = [];
    if (entry.dias_em_atraso > 0) riskFactors.push('Lead em atraso');
    if (lead.lead_score < 50) riskFactors.push('Score baixo');
    if (entry.tempo_em_etapa_dias > currentStage.prazo_em_dias * 1.5) riskFactors.push('Tempo excessivo na etapa');

    const recommendations = [];
    if (conversionProbability > 70) recommendations.push('Priorizar fechamento');
    if (riskFactors.length > 0) recommendations.push('Implementar ações de retenção');
    if (entry.tempo_em_etapa_dias > currentStage.prazo_em_dias) recommendations.push('Acelerar processo');

    return {
      leadId: lead.id,
      leadName: lead.nome,
      currentStage: currentStage.nome,
      conversionProbability,
      daysToClose,
      riskFactors,
      recommendations
    };
  };

  // Calcular risco de churn
  const calculateChurnRisk = (entry: any, lead: any): number => {
    let riskScore = 0;
    
    // Fatores de risco
    if (entry.dias_em_atraso > 3) riskScore += 30;
    if (entry.tempo_em_etapa_dias > 14) riskScore += 25;
    if (lead.lead_score < 40) riskScore += 20;
    if (entry.saude_etapa === 'Vermelho') riskScore += 25;
    
    return Math.min(100, riskScore);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'conversion': return TrendingUp;
      case 'bottleneck': return AlertTriangle;
      case 'churn_risk': return TrendingDown;
      case 'opportunity': return Target;
      default: return Brain;
    }
  };

  useEffect(() => {
    if (entries.length > 0) {
      generatePredictiveInsights();
    }
  }, [pipelineId, entries.length]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Análise Preditiva</h2>
          <p className="text-muted-foreground">
            Insights inteligentes para otimização do pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastAnalysis && (
            <span className="text-sm text-muted-foreground">
              Última análise: {lastAnalysis.toLocaleString()}
            </span>
          )}
          <Button 
            onClick={generatePredictiveInsights}
            disabled={isAnalyzing}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Analisando...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Analisar
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="insights">Insights Estratégicos</TabsTrigger>
          <TabsTrigger value="predictions">Previsões Detalhadas</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {insights.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Execute a análise preditiva para visualizar insights inteligentes
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {insights.map((insight, index) => {
                const Icon = getInsightIcon(insight.type);
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{insight.title}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {insight.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityColor(insight.priority)}>
                            {insight.priority}
                          </Badge>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              {insight.score}%
                            </div>
                            <p className="text-xs text-muted-foreground">confiança</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Alert>
                        <Zap className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Recomendação:</strong> {insight.recommendation}
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          {predictions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma previsão disponível. Execute a análise preditiva.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {predictions.slice(0, 10).map((prediction, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{prediction.leadName}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {prediction.currentStage}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-success">
                          {prediction.conversionProbability}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          conversão prevista
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {prediction.daysToClose} dias para fechamento
                        </span>
                      </div>
                    </div>
                    
                    <Progress 
                      value={prediction.conversionProbability} 
                      className="h-2" 
                    />
                    
                    {prediction.riskFactors.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-warning">
                          Fatores de Risco:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {prediction.riskFactors.map((factor, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {prediction.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-primary">
                          Recomendações:
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {prediction.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-primary rounded-full" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}