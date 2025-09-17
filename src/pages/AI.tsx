import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AILeadScoring } from '@/components/ai/AILeadScoring';
import { IntelligentCommunicationAssistant } from '@/components/ai/IntelligentCommunicationAssistant';
import { SmartDataInsights } from '@/components/ai/SmartDataInsights';
import { Brain, Target, MessageSquare, BarChart3, Sparkles } from 'lucide-react';

export default function AI() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">IA & Machine Learning</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Transforme seus dados em insights inteligentes e automatize processos com tecnologia de IA avançada
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg transition-all duration-300">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 mb-2">
              <Target className="w-6 h-6 text-blue-500" />
            </div>
            <CardTitle className="text-lg">Lead Scoring IA</CardTitle>
            <CardDescription>
              Análise preditiva e scoring inteligente de leads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-primary" />
                Predição de conversão
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-primary" />
                Recomendações automatizadas
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-primary" />
                Análise de riscos
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent hover:shadow-lg transition-all duration-300">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/5 mb-2">
              <MessageSquare className="w-6 h-6 text-green-500" />
            </div>
            <CardTitle className="text-lg">Assistente de Comunicação</CardTitle>
            <CardDescription>
              Geração automática de conteúdo personalizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-primary" />
                Mensagens WhatsApp
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-primary" />
                Templates de email
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-primary" />
                Scripts de ligação
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent hover:shadow-lg transition-all duration-300">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/5 mb-2">
              <BarChart3 className="w-6 h-6 text-purple-500" />
            </div>
            <CardTitle className="text-lg">Smart Data Insights</CardTitle>
            <CardDescription>
              Análise inteligente de padrões e tendências
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-primary" />
                Identificação de padrões
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-primary" />
                Oportunidades ocultas
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-primary" />
                Alertas inteligentes
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="lead-scoring" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="lead-scoring" className="text-sm">
                <Target className="w-4 h-4 mr-2" />
                Lead Scoring IA
              </TabsTrigger>
              <TabsTrigger value="communication" className="text-sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Assistente Comunicação
              </TabsTrigger>
              <TabsTrigger value="insights" className="text-sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Data Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lead-scoring">
              <AILeadScoring />
            </TabsContent>

            <TabsContent value="communication">
              <IntelligentCommunicationAssistant />
            </TabsContent>

            <TabsContent value="insights">
              <SmartDataInsights />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-foreground">Powered by Advanced AI</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Todas as funcionalidades utilizam algoritmos de machine learning avançados para fornecer 
            insights precisos e recomendações acionáveis baseadas nos seus dados de CRM.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}