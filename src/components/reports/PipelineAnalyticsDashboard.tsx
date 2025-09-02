import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  DollarSign, 
  Clock,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  Filter,
  Download,
  Calendar
} from 'lucide-react';
import { useSupabasePipelineAnalytics } from '@/hooks/useSupabasePipelineAnalytics';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { SLAMonitor } from '@/components/pipeline/SLAMonitor';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'number' | 'currency' | 'percentage' | 'days';
}

function MetricCard({ title, value, change, icon, trend = 'neutral', format = 'number' }: MetricCardProps) {
  const formatValue = (val: string | number) => {
    const numVal = typeof val === 'string' ? parseFloat(val) : val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numVal);
      case 'percentage':
        return `${numVal.toFixed(1)}%`;
      case 'days':
        return `${numVal} dias`;
      default:
        return numVal.toLocaleString('pt-BR');
    }
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-success" />;
    if (trend === 'down') return <TrendingDown className="h-3 w-3 text-destructive" />;
    return null;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm text-muted-foreground">{title}</span>
          </div>
          {change !== undefined && (
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <span className={`text-xs ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'}`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
          )}
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold">{formatValue(value)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface StagePerformanceProps {
  stageMetrics: Array<{
    stageId: string;
    stageName: string;
    leadsCount: number;
    averageTimeInStage: number;
    overdueCount: number;
    healthDistribution: {
      verde: number;
      amarelo: number;
      vermelho: number;
    };
  }>;
}

function StagePerformance({ stageMetrics }: StagePerformanceProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance por Etapa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stageMetrics.map((stage) => {
            const totalLeads = stage.leadsCount;
            const healthyPercentage = totalLeads > 0 ? (stage.healthDistribution.verde / totalLeads) * 100 : 0;
            
            return (
              <div key={stage.stageId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{stage.stageName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {totalLeads} leads • {stage.averageTimeInStage} dias médios
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {stage.overdueCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {stage.overdueCount} atrasados
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {Math.round(healthyPercentage)}% saudável
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Saúde dos Leads</span>
                    <span>{totalLeads} total</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                    <div 
                      className="bg-success" 
                      style={{ width: `${totalLeads > 0 ? (stage.healthDistribution.verde / totalLeads) * 100 : 0}%` }}
                    />
                    <div 
                      className="bg-warning" 
                      style={{ width: `${totalLeads > 0 ? (stage.healthDistribution.amarelo / totalLeads) * 100 : 0}%` }}
                    />
                    <div 
                      className="bg-destructive" 
                      style={{ width: `${totalLeads > 0 ? (stage.healthDistribution.vermelho / totalLeads) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-success">{stage.healthDistribution.verde} Verde</span>
                    <span className="text-warning">{stage.healthDistribution.amarelo} Amarelo</span>
                    <span className="text-destructive">{stage.healthDistribution.vermelho} Vermelho</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function PipelineAnalyticsDashboard() {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | undefined>();
  
  const { pipelines } = useSupabasePipelines();
  const { 
    pipelineMetrics, 
    stageMetrics, 
    performanceData, 
    loading 
  } = useSupabasePipelineAnalytics(
    selectedPipelineId === 'all' ? undefined : selectedPipelineId,
    dateRange
  );

  const handleExportData = () => {
    // Implementation for data export
    console.log('Exporting analytics data...');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Relatórios</h1>
          <p className="text-muted-foreground">
            Acompanhe a performance dos seus pipelines em tempo real
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecionar pipeline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Pipelines</SelectItem>
              {pipelines.map(pipeline => (
                <SelectItem key={pipeline.id} value={pipeline.id}>
                  {pipeline.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Leads"
          value={pipelineMetrics?.totalLeads || 0}
          icon={<Users className="h-4 w-4 text-primary" />}
          format="number"
        />
        <MetricCard
          title="Taxa de Conversão"
          value={pipelineMetrics?.conversionRate || 0}
          icon={<Target className="h-4 w-4 text-success" />}
          format="percentage"
          trend="up"
          change={2.3}
        />
        <MetricCard
          title="Valor Total"
          value={pipelineMetrics?.totalValue || 0}
          icon={<DollarSign className="h-4 w-4 text-success" />}
          format="currency"
          trend="up"
          change={15.2}
        />
        <MetricCard
          title="Tempo Médio"
          value={pipelineMetrics?.averageTimeInPipeline || 0}
          icon={<Clock className="h-4 w-4 text-warning" />}
          format="days"
          trend="down"
          change={-5.1}
        />
      </div>

      {/* Performance Overview */}
      {performanceData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Pipelines Ativos</p>
                  <p className="text-xl font-bold">{performanceData.totalPipelines}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Etapas</p>
                  <p className="text-xl font-bold">{performanceData.totalStages}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Leads no SLA</p>
                  <p className="text-xl font-bold text-success">{performanceData.leadsInSLA}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <div>
                  <p className="text-sm text-muted-foreground">Leads Atrasados</p>
                  <p className="text-xl font-bold text-destructive">{performanceData.leadsOverdue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Performance */}
        <StagePerformance stageMetrics={stageMetrics} />

        {/* SLA Monitor */}
        <SLAMonitor 
          pipelineId={selectedPipelineId === 'all' ? '' : selectedPipelineId} 
        />
      </div>

      {/* Additional Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Insights & Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceData?.leadsOverdue && performanceData.leadsOverdue > 0 && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <h4 className="font-medium text-destructive">Atenção: Leads Atrasados</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Você tem {performanceData.leadsOverdue} leads atrasados que precisam de atenção imediata.
                    Considere revisar os SLAs das etapas ou redistribuir a carga de trabalho.
                  </p>
                </div>
              </div>
            )}

            {pipelineMetrics && pipelineMetrics.conversionRate < 20 && (
              <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <Target className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <h4 className="font-medium text-warning">Oportunidade de Melhoria</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sua taxa de conversão atual é de {pipelineMetrics.conversionRate.toFixed(1)}%. 
                    Considere revisar os critérios de qualificação de leads ou otimizar o processo de vendas.
                  </p>
                </div>
              </div>
            )}

            {pipelineMetrics && pipelineMetrics.averageTimeInPipeline > 30 && (
              <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-primary">Otimização de Processo</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    O tempo médio no pipeline é de {pipelineMetrics.averageTimeInPipeline} dias. 
                    Considere automatizar algumas etapas ou revisar os prazos definidos.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}