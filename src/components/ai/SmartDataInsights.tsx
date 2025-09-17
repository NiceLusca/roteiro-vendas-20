import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Target,
  Lightbulb,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface Insight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  category: string;
}

export function SmartDataInsights() {
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const { leads } = useSupabaseLeads();
  const { pipelines } = useSupabasePipelines();
  const { toast } = useToast();

  const generateInsights = async () => {
    setAnalyzing(true);
    try {
      // Simular análise de dados por IA
      await new Promise(resolve => setTimeout(resolve, 2500));

      const generatedInsights: Insight[] = [
        {
          id: '1',
          type: 'opportunity',
          title: 'Oportunidade de Upsell Identificada',
          description: 'Clientes com score alto (>80) mostram 75% mais propensão a aceitar ofertas adicionais. Identifique 23 leads qualificados.',
          impact: 'high',
          confidence: 89,
          actionable: true,
          category: 'Vendas'
        },
        {
          id: '2',
          type: 'risk',
          title: 'Risco de Churn em Leads Qualificados',
          description: '12 leads estão há mais de 14 dias sem interação na etapa de qualificação. Taxa de conversão cai 45% após esse período.',
          impact: 'high',
          confidence: 92,
          actionable: true,
          category: 'Pipeline'
        },
        {
          id: '3',
          type: 'trend',
          title: 'Tendência Positiva em Conversões',
          description: 'Taxa de conversão aumentou 23% nas últimas 4 semanas, especialmente em leads vindos de indicação.',
          impact: 'medium',
          confidence: 87,
          actionable: false,
          category: 'Performance'
        },
        {
          id: '4',
          type: 'recommendation',
          title: 'Otimizar Timing de Follow-up',
          description: 'Leads contatados entre 14h-16h mostram 34% mais engajamento. Reajuste agenda da equipe.',
          impact: 'medium',
          confidence: 81,
          actionable: true,
          category: 'Processo'
        },
        {
          id: '5',
          type: 'opportunity',
          title: 'Segmento de Alto Valor Identificado',
          description: 'Leads do segmento "E-commerce" têm ticket médio 67% maior. Foque recursos neste nicho.',
          impact: 'high',
          confidence: 94,
          actionable: true,
          category: 'Estratégia'
        },
        {
          id: '6',
          type: 'risk',
          title: 'Gargalo na Etapa de Proposta',
          description: 'Tempo médio na etapa de proposta aumentou 40% no último mês. Revise processo de aprovação.',
          impact: 'medium',
          confidence: 85,
          actionable: true,
          category: 'Pipeline'
        }
      ];

      // Gerar dados de performance
      const perfData = Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        conversions: Math.floor(Math.random() * 50) + 20,
        leadScore: Math.floor(Math.random() * 40) + 40,
        efficiency: Math.floor(Math.random() * 30) + 60
      }));

      setInsights(generatedInsights);
      setPerformanceData(perfData);

      toast({
        title: "Análise Concluída",
        description: `${generatedInsights.length} insights gerados pela IA`
      });
    } catch (error) {
      toast({
        title: "Erro na Análise",
        description: "Não foi possível gerar os insights",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Target className="w-4 h-4 text-green-500" />;
      case 'risk': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'trend': return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'recommendation': return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      default: return <Brain className="w-4 h-4 text-primary" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'risk': return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'trend': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'recommendation': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      default: return 'bg-muted';
    }
  };

  // Dados para gráficos
  const insightsByCategory = insights.reduce((acc, insight) => {
    acc[insight.category] = (acc[insight.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = Object.entries(insightsByCategory).map(([category, count]) => ({
    name: category,
    value: count
  }));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Smart Data Insights</h2>
          <p className="text-muted-foreground">Análise inteligente de padrões e oportunidades</p>
        </div>
        <Button 
          onClick={generateInsights}
          disabled={analyzing}
          className="bg-gradient-to-r from-primary to-primary/80"
        >
          <Brain className="w-4 h-4 mr-2" />
          {analyzing ? 'Analisando...' : 'Gerar Insights'}
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Oportunidades</p>
                <p className="text-2xl font-bold text-foreground">
                  {insights.filter(i => i.type === 'opportunity').length}
                </p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Riscos</p>
                <p className="text-2xl font-bold text-foreground">
                  {insights.filter(i => i.type === 'risk').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tendências</p>
                <p className="text-2xl font-bold text-foreground">
                  {insights.filter(i => i.type === 'trend').length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ações</p>
                <p className="text-2xl font-bold text-foreground">
                  {insights.filter(i => i.actionable).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Dashboard */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Performance Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Line 
                    type="monotone" 
                    dataKey="conversions" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="efficiency" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    dot={{ fill: '#82ca9d' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Insights Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                Insights por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPieChart>
                  <Pie 
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights List */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Insights Detalhados
            </CardTitle>
            <CardDescription>
              Análises inteligentes baseadas nos seus dados de CRM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="opportunity">Oportunidades</TabsTrigger>
                <TabsTrigger value="risk">Riscos</TabsTrigger>
                <TabsTrigger value="trend">Tendências</TabsTrigger>
                <TabsTrigger value="recommendation">Ações</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-4">
                {insights.map((insight) => (
                  <Card key={insight.id} className={`p-4 ${getTypeColor(insight.type)}`}>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getInsightIcon(insight.type)}
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{insight.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={getImpactColor(insight.impact)}>
                            {insight.impact} impact
                          </Badge>
                          {insight.actionable && (
                            <Badge variant="outline">
                              Acionável
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Confiança:</span>
                          <Progress value={insight.confidence} className="w-20 h-2" />
                          <span className="text-xs font-medium">{insight.confidence}%</span>
                        </div>
                        <Badge variant="secondary">
                          {insight.category}
                        </Badge>
                      </div>

                      {insight.actionable && (
                        <div className="pt-2 border-t border-border/50">
                          <Button variant="outline" size="sm">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Aplicar Recomendação
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </TabsContent>

              {['opportunity', 'risk', 'trend', 'recommendation'].map((type) => (
                <TabsContent key={type} value={type} className="space-y-4 mt-4">
                  {insights
                    .filter((insight) => insight.type === type)
                    .map((insight) => (
                      <Card key={insight.id} className={`p-4 ${getTypeColor(insight.type)}`}>
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              {getInsightIcon(insight.type)}
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground">{insight.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant={getImpactColor(insight.impact)}>
                                {insight.impact} impact
                              </Badge>
                              {insight.actionable && (
                                <Badge variant="outline">
                                  Acionável
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Confiança:</span>
                              <Progress value={insight.confidence} className="w-20 h-2" />
                              <span className="text-xs font-medium">{insight.confidence}%</span>
                            </div>
                            <Badge variant="secondary">
                              {insight.category}
                            </Badge>
                          </div>

                          {insight.actionable && (
                            <div className="pt-2 border-t border-border/50">
                              <Button variant="outline" size="sm">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Aplicar Recomendação
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}