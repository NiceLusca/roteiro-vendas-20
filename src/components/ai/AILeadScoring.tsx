import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { useToast } from '@/hooks/use-toast';
import { Brain, TrendingUp, Target, Zap, AlertCircle, CheckCircle, Calendar, User } from 'lucide-react';

export function AILeadScoring() {
  const [analyzing, setAnalyzing] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const { leads, loading } = useSupabaseLeads();
  const { toast } = useToast();

  const analyzeLeads = async () => {
    setAnalyzing(true);
    try {
      // Simular análise AI dos leads
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const aiPredictions = leads?.map(lead => ({
        id: lead.id,
        name: lead.nome,
        currentScore: lead.lead_score || 0,
        predictedScore: Math.min(100, (lead.lead_score || 0) + Math.floor(Math.random() * 30)),
        conversionProbability: Math.floor(Math.random() * 100),
        recommendedActions: generateRecommendations(lead),
        riskFactors: generateRiskFactors(lead),
        timeline: generateTimeline(lead)
      })) || [];

      setPredictions(aiPredictions);
      toast({
        title: "Análise AI Concluída",
        description: `Analisados ${aiPredictions.length} leads com IA avançada`
      });
    } catch (error) {
      toast({
        title: "Erro na Análise",
        description: "Não foi possível completar a análise AI",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const generateRecommendations = (lead: any) => {
    const actions = [
      { action: "Agendar call personalizada", priority: "high", impact: "+15 pontos" },
      { action: "Enviar conteúdo educativo", priority: "medium", impact: "+8 pontos" },
      { action: "Follow-up via WhatsApp", priority: "high", impact: "+12 pontos" },
      { action: "Proposta customizada", priority: "low", impact: "+20 pontos" }
    ];
    return actions.slice(0, 2 + Math.floor(Math.random() * 2));
  };

  const generateRiskFactors = (lead: any) => {
    const risks = [
      { factor: "Sem interação há 7+ dias", severity: "medium" },
      { factor: "Objeção de preço identificada", severity: "high" },
      { factor: "Concorrência ativa", severity: "low" },
      { factor: "Orçamento não qualificado", severity: "high" }
    ];
    return risks.slice(0, 1 + Math.floor(Math.random() * 2));
  };

  const generateTimeline = (lead: any) => {
    return {
      nextContact: "2-3 dias",
      expectedConversion: "7-14 dias",
      criticalWindow: "próximos 5 dias"
    };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">IA Lead Scoring</h2>
          <p className="text-muted-foreground">Análise preditiva e recommendations inteligentes</p>
        </div>
        <Button 
          onClick={analyzeLeads}
          disabled={analyzing}
          className="bg-gradient-to-r from-primary to-primary/80"
        >
          <Brain className="w-4 h-4 mr-2" />
          {analyzing ? 'Analisando...' : 'Analisar Leads'}
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold text-foreground">{leads?.length || 0}</p>
              </div>
              <User className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alta Conversão</p>
                <p className="text-2xl font-bold text-foreground">{predictions.filter(p => p.conversionProbability > 70).length}</p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Necessita Ação</p>
                <p className="text-2xl font-bold text-foreground">{predictions.filter(p => p.conversionProbability < 40).length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score Médio</p>
                <p className="text-2xl font-bold text-foreground">
                  {predictions.length > 0 ? Math.round(predictions.reduce((acc, p) => acc + p.predictedScore, 0) / predictions.length) : 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predictions Results */}
      {predictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Análise Preditiva dos Leads
            </CardTitle>
            <CardDescription>
              Insights gerados por IA para otimizar suas estratégias de conversão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {predictions.slice(0, 10).map((prediction) => (
                <Card key={prediction.id} className="p-4">
                  <div className="space-y-4">
                    {/* Lead Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{prediction.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            Score: {prediction.currentScore} → {prediction.predictedScore}
                          </Badge>
                          <Badge variant={prediction.conversionProbability > 70 ? 'default' : 'secondary'}>
                            Conversão: {prediction.conversionProbability}%
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Probabilidade de Conversão</p>
                        <Progress value={prediction.conversionProbability} className="w-32" />
                      </div>
                    </div>

                    <Tabs defaultValue="recommendations" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="recommendations">Ações</TabsTrigger>
                        <TabsTrigger value="risks">Riscos</TabsTrigger>
                        <TabsTrigger value="timeline">Timeline</TabsTrigger>
                      </TabsList>

                      <TabsContent value="recommendations" className="space-y-2">
                        {prediction.recommendedActions.map((action: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm">{action.action}</span>
                            </div>
                            <div className="flex items-center gap-2">
                            <Badge variant={getPriorityColor(action.priority)}>
                              {action.priority}
                            </Badge>
                            <Badge variant="outline">
                              {action.impact}
                            </Badge>
                            </div>
                          </div>
                        ))}
                      </TabsContent>

                      <TabsContent value="risks" className="space-y-2">
                        {prediction.riskFactors.map((risk: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-orange-500" />
                              <span className="text-sm">{risk.factor}</span>
                            </div>
                            <Badge variant={getSeverityColor(risk.severity)}>
                              {risk.severity}
                            </Badge>
                          </div>
                        ))}
                      </TabsContent>

                      <TabsContent value="timeline" className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Próximo Contato</p>
                              <p className="text-sm font-medium">{prediction.timeline.nextContact}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                            <Target className="w-4 h-4 text-green-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Conversão Esperada</p>
                              <p className="text-sm font-medium">{prediction.timeline.expectedConversion}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Janela Crítica</p>
                              <p className="text-sm font-medium">{prediction.timeline.criticalWindow}</p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}