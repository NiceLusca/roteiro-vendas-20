import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  Users,
  UserCheck,
  DollarSign,
  Clock,
  Target,
  Activity,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { useSupabaseLeadPipelineEntries } from '@/hooks/useSupabaseLeadPipelineEntries';
import { useSupabasePipelineStages } from '@/hooks/useSupabasePipelineStages';
import { useSupabaseDeals } from '@/hooks/useSupabaseDeals';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface ConversionFunnelAnalyticsProps {
  className?: string;
  pipelineId?: string;
}

interface FunnelStage {
  id: string;
  name: string;
  leads: number;
  conversions: number;
  conversionRate: number;
  avgTimeInStage: number;
  dropOffRate: number;
  revenue: number;
}

interface FunnelMetrics {
  totalLeads: number;
  totalConversions: number;
  overallConversionRate: number;
  totalRevenue: number;
  avgSalesCycleTime: number;
  bottleneckStage: string;
  stages: FunnelStage[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function ConversionFunnelAnalytics({ className, pipelineId }: ConversionFunnelAnalyticsProps) {
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | '1y'>('30d');
  const [viewMode, setViewMode] = useState<'absolute' | 'percentage'>('absolute');

  const { leads, loading: leadsLoading } = useSupabaseLeads();
  const { entries: pipelineEntries, loading: entriesLoading } = useSupabaseLeadPipelineEntries(pipelineId);
  const { stages, loading: stagesLoading } = useSupabasePipelineStages();
  const { deals, loading: dealsLoading } = useSupabaseDeals();

  const loading = leadsLoading || entriesLoading || stagesLoading || dealsLoading;

  // Calculate funnel metrics
  const funnelMetrics = useMemo((): FunnelMetrics => {
    if (!leads || !pipelineEntries || !stages || !deals) {
      return {
        totalLeads: 0,
        totalConversions: 0,
        overallConversionRate: 0,
        totalRevenue: 0,
        avgSalesCycleTime: 0,
        bottleneckStage: '',
        stages: []
      };
    }

    // Filter by pipeline if specified
    const filteredStages = pipelineId 
      ? stages.filter(stage => stage.pipeline_id === pipelineId)
      : stages;

    const filteredEntries = pipelineId
      ? pipelineEntries.filter(entry => 
          filteredStages.some(stage => stage.id === entry.etapa_atual_id)
        )
      : pipelineEntries;

    // Calculate stage metrics
    const stageMetrics: FunnelStage[] = filteredStages
      .sort((a, b) => a.ordem - b.ordem)
      .map((stage, index) => {
        const stageEntries = filteredEntries.filter(entry => entry.etapa_atual_id === stage.id);
        const stageLeads = stageEntries.length;
        
        // Calculate conversions (leads who moved to next stage or completed)
        const nextStage = filteredStages.find(s => s.ordem === stage.ordem + 1);
        const conversions = nextStage 
          ? filteredEntries.filter(entry => entry.etapa_atual_id === nextStage.id).length
          : deals.filter(deal => deal.status === 'Ganha').length;
        
        const conversionRate = stageLeads > 0 ? (conversions / stageLeads) * 100 : 0;
        const avgTimeInStage = stageEntries.reduce((sum, entry) => sum + (entry.tempo_em_etapa_dias || 0), 0) / stageLeads || 0;
        
        // Calculate drop-off rate
        const previousStage = filteredStages.find(s => s.ordem === stage.ordem - 1);
        const previousLeads = previousStage 
          ? filteredEntries.filter(entry => entry.etapa_atual_id === previousStage.id).length
          : stageLeads;
        const dropOffRate = previousLeads > 0 ? ((previousLeads - stageLeads) / previousLeads) * 100 : 0;
        
        // Calculate revenue for this stage (simplified)
        const stageRevenue = deals
          .filter(deal => deal.status === 'Ganha')
          .reduce((sum, deal) => sum + Number(deal.valor_proposto || 0), 0) / filteredStages.length;

        return {
          id: stage.id,
          name: stage.nome,
          leads: stageLeads,
          conversions,
          conversionRate,
          avgTimeInStage,
          dropOffRate,
          revenue: stageRevenue
        };
      });

    const totalLeads = leads.length;
    const totalConversions = deals.filter(deal => deal.status === 'Ganha').length;
    const overallConversionRate = totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0;
    const totalRevenue = deals
      .filter(deal => deal.status === 'Ganha')
      .reduce((sum, deal) => sum + Number(deal.valor_proposto || 0), 0);
    
    // Find bottleneck stage (highest drop-off rate)
    const bottleneckStage = stageMetrics.reduce((worst, current) => 
      current.dropOffRate > worst.dropOffRate ? current : worst
    ).name;

    // Calculate average sales cycle time
    const avgSalesCycleTime = stageMetrics.reduce((sum, stage) => sum + stage.avgTimeInStage, 0);

    return {
      totalLeads,
      totalConversions,
      overallConversionRate,
      totalRevenue,
      avgSalesCycleTime,
      bottleneckStage,
      stages: stageMetrics
    };
  }, [leads, pipelineEntries, stages, deals, pipelineId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span>Carregando análise do funil...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análise do Funil de Conversão</h2>
          <p className="text-muted-foreground">
            Identificação de gargalos e oportunidades de otimização
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'absolute' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('absolute')}
          >
            Absoluto
          </Button>
          <Button
            variant={viewMode === 'percentage' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('percentage')}
          >
            Percentual
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Leads</p>
                <p className="text-2xl font-bold">{funnelMetrics.totalLeads}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversões</p>
                <p className="text-2xl font-bold">{funnelMetrics.totalConversions}</p>
              </div>
              <UserCheck className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa Global</p>
                <p className="text-2xl font-bold">{funnelMetrics.overallConversionRate.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold">{formatCurrency(funnelMetrics.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ciclo Médio</p>
                <p className="text-2xl font-bold">{funnelMetrics.avgSalesCycleTime.toFixed(0)}d</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelMetrics.stages.map((stage, index) => {
              const isBottleneck = stage.name === funnelMetrics.bottleneckStage;
              const progressValue = viewMode === 'percentage' 
                ? stage.conversionRate 
                : (stage.leads / funnelMetrics.totalLeads) * 100;

              return (
                <div 
                  key={stage.id} 
                  className={cn(
                    'p-4 border rounded-lg',
                    isBottleneck && 'border-destructive bg-destructive/5'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{stage.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {stage.leads} leads • {stage.avgTimeInStage.toFixed(1)} dias médios
                        </p>
                      </div>
                      {isBottleneck && (
                        <Badge variant="destructive">Gargalo</Badge>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {viewMode === 'percentage' 
                          ? `${stage.conversionRate.toFixed(1)}%`
                          : stage.leads.toLocaleString()
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {stage.dropOffRate > 0 && (
                          <span className="text-destructive flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" />
                            {stage.dropOffRate.toFixed(1)}% perda
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <Progress 
                    value={progressValue} 
                    className={cn(
                      'h-3',
                      isBottleneck && 'bg-destructive/20'
                    )}
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0</span>
                    <span>
                      {viewMode === 'percentage' ? '100%' : funnelMetrics.totalLeads.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Rates Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Conversão por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelMetrics.stages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                <Bar dataKey="conversionRate" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time in Stage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tempo Médio por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={funnelMetrics.stages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)} dias`} />
                <Line 
                  type="monotone" 
                  dataKey="avgTimeInStage" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Insights e Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelMetrics.bottleneckStage && (
              <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <h4 className="font-medium text-destructive mb-2">🚨 Gargalo Identificado</h4>
                <p className="text-sm">
                  A etapa <strong>{funnelMetrics.bottleneckStage}</strong> apresenta a maior taxa de abandono. 
                  Considere revisar os processos e critérios desta etapa.
                </p>
              </div>
            )}
            
            {funnelMetrics.overallConversionRate < 10 && (
              <div className="p-4 border border-warning/20 rounded-lg bg-warning/5">
                <h4 className="font-medium text-warning mb-2">⚠️ Taxa de Conversão Baixa</h4>
                <p className="text-sm">
                  A taxa de conversão global de {funnelMetrics.overallConversionRate.toFixed(1)}% está abaixo do ideal. 
                  Considere otimizar a qualificação de leads na entrada do funil.
                </p>
              </div>
            )}
            
            {funnelMetrics.avgSalesCycleTime > 30 && (
              <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
                <h4 className="font-medium text-primary mb-2">💡 Oportunidade de Otimização</h4>
                <p className="text-sm">
                  O ciclo de vendas médio de {funnelMetrics.avgSalesCycleTime.toFixed(0)} dias pode ser reduzido 
                  através de automações e melhoria nos processos das etapas mais demoradas.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}