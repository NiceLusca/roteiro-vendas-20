import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  Heart,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Target,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useSupabaseLeadPipelineEntries } from '@/hooks/useSupabaseLeadPipelineEntries';
import { useSupabasePipelineStages } from '@/hooks/useSupabasePipelineStages';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { SLAMonitor } from '@/components/pipeline/SLAMonitor';
import { NotificationSystem } from '@/components/pipeline/NotificationSystem';
import { WorkflowOrchestrator } from '@/components/pipeline/WorkflowOrchestrator';

interface PipelineHealth {
  pipelineId: string;
  pipelineName: string;
  overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
  healthScore: number;
  totalLeads: number;
  activeLeads: number;
  overdueLeads: number;
  averageStageTime: number;
  conversionRate: number;
  slaCompliance: number;
  trends: {
    leadsChange: number;
    conversionChange: number;
    slaChange: number;
  };
  criticalIssues: string[];
  recommendations: string[];
}

interface StageHealth {
  stageId: string;
  stageName: string;
  leadsCount: number;
  averageTime: number;
  slaCompliance: number;
  bottleneck: boolean;
  healthColor: 'success' | 'warning' | 'destructive';
}

interface PipelineHealthDashboardProps {
  pipelineId?: string;
  className?: string;
}

export function PipelineHealthDashboard({ pipelineId, className }: PipelineHealthDashboardProps) {
  const [pipelineHealth, setPipelineHealth] = useState<PipelineHealth[]>([]);
  const [stageHealth, setStageHealth] = useState<StageHealth[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string | undefined>(pipelineId);
  const [refreshing, setRefreshing] = useState(false);

  const { pipelines } = useSupabasePipelines();
  const { entries } = useSupabaseLeadPipelineEntries(selectedPipeline);
  const { stages } = useSupabasePipelineStages(selectedPipeline);

  useEffect(() => {
    calculatePipelineHealth();
  }, [pipelines, entries, stages]);

  const calculatePipelineHealth = () => {
    if (!pipelines.length) return;

    const healthData: PipelineHealth[] = pipelines.map(pipeline => {
      const pipelineEntries = entries.filter(entry => entry.pipeline_id === pipeline.id);
      const activeEntries = pipelineEntries.filter(entry => entry.status_inscricao === 'Ativo');
      const overdueEntries = activeEntries.filter(entry => entry.dias_em_atraso > 0);
      const completedEntries = pipelineEntries.filter(entry => entry.status_inscricao === 'Concluído');

      const totalLeads = pipelineEntries.length;
      const activeLeads = activeEntries.length;
      const overdueLeads = overdueEntries.length;
      
      const averageStageTime = activeEntries.length > 0
        ? activeEntries.reduce((sum, entry) => sum + entry.tempo_em_etapa_dias, 0) / activeEntries.length
        : 0;

      const conversionRate = totalLeads > 0 ? (completedEntries.length / totalLeads) * 100 : 0;
      const slaCompliance = activeLeads > 0 ? ((activeLeads - overdueLeads) / activeLeads) * 100 : 100;

      // Calculate health score (0-100)
      let healthScore = 100;
      healthScore -= (overdueLeads / Math.max(activeLeads, 1)) * 30; // SLA violations penalty
      healthScore -= Math.max(0, (averageStageTime - 5) * 2); // Stage time penalty
      healthScore += Math.min(20, conversionRate * 0.3); // Conversion bonus
      healthScore = Math.max(0, Math.min(100, healthScore));

      // Determine overall health
      let overallHealth: PipelineHealth['overallHealth'];
      if (healthScore >= 85) overallHealth = 'excellent';
      else if (healthScore >= 70) overallHealth = 'good';
      else if (healthScore >= 50) overallHealth = 'warning';
      else overallHealth = 'critical';

      // Generate critical issues
      const criticalIssues: string[] = [];
      if (overdueLeads > activeLeads * 0.2) {
        criticalIssues.push(`${overdueLeads} leads atrasados (${Math.round((overdueLeads/activeLeads)*100)}%)`);
      }
      if (averageStageTime > 10) {
        criticalIssues.push(`Tempo médio em etapa muito alto: ${Math.round(averageStageTime)} dias`);
      }
      if (conversionRate < 20) {
        criticalIssues.push(`Taxa de conversão baixa: ${Math.round(conversionRate)}%`);
      }

      // Generate recommendations
      const recommendations: string[] = [];
      if (overdueLeads > 0) {
        recommendations.push('Revisar leads atrasados e acelerar processamento');
      }
      if (averageStageTime > 7) {
        recommendations.push('Otimizar processos para reduzir tempo em etapas');
      }
      if (conversionRate < 30) {
        recommendations.push('Analisar pontos de atrito no funil de conversão');
      }

      return {
        pipelineId: pipeline.id,
        pipelineName: pipeline.nome,
        overallHealth,
        healthScore: Math.round(healthScore),
        totalLeads,
        activeLeads,
        overdueLeads,
        averageStageTime: Math.round(averageStageTime),
        conversionRate: Math.round(conversionRate),
        slaCompliance: Math.round(slaCompliance),
        trends: {
          leadsChange: Math.floor(Math.random() * 20) - 10, // Mock data
          conversionChange: Math.floor(Math.random() * 10) - 5, // Mock data
          slaChange: Math.floor(Math.random() * 15) - 7 // Mock data
        },
        criticalIssues,
        recommendations
      };
    });

    setPipelineHealth(healthData);

    // Calculate stage health for selected pipeline
    if (selectedPipeline) {
      const pipelineStages = stages.filter(stage => stage.pipeline_id === selectedPipeline);
      const stageHealthData: StageHealth[] = pipelineStages.map(stage => {
        const stageEntries = entries.filter(entry => 
          entry.etapa_atual_id === stage.id && entry.status_inscricao === 'Ativo'
        );
        
        const leadsCount = stageEntries.length;
        const overdueCount = stageEntries.filter(entry => entry.dias_em_atraso > 0).length;
        const averageTime = leadsCount > 0
          ? stageEntries.reduce((sum, entry) => sum + entry.tempo_em_etapa_dias, 0) / leadsCount
          : 0;
        
        const slaCompliance = leadsCount > 0 ? ((leadsCount - overdueCount) / leadsCount) * 100 : 100;
        
        // Detect bottlenecks (stages with high lead count and long average time)
        const bottleneck = leadsCount > 5 && averageTime > stage.prazo_em_dias * 0.8;
        
        let healthColor: StageHealth['healthColor'];
        if (slaCompliance >= 90 && !bottleneck) healthColor = 'success';
        else if (slaCompliance >= 70) healthColor = 'warning';
        else healthColor = 'destructive';

        return {
          stageId: stage.id,
          stageName: stage.nome,
          leadsCount,
          averageTime: Math.round(averageTime),
          slaCompliance: Math.round(slaCompliance),
          bottleneck,
          healthColor
        };
      });

      setStageHealth(stageHealthData);
    }
  };

  const getHealthColor = (health: PipelineHealth['overallHealth']) => {
    switch (health) {
      case 'excellent': return 'text-success';
      case 'good': return 'text-primary';
      case 'warning': return 'text-warning';
      case 'critical': return 'text-destructive';
    }
  };

  const getHealthBadgeVariant = (health: PipelineHealth['overallHealth']) => {
    switch (health) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return TrendingUp;
    if (change < 0) return TrendingDown;
    return Activity;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-success';
    if (change < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const refreshData = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    calculatePipelineHealth();
    setRefreshing(false);
  };

  const overallHealth = pipelineHealth.length > 0
    ? pipelineHealth.reduce((sum, p) => sum + p.healthScore, 0) / pipelineHealth.length
    : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Health Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              Saúde dos Pipelines
              <Badge variant="outline" className="ml-2">
                {Math.round(overallHealth)}% Saúde Geral
              </Badge>
            </CardTitle>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{pipelineHealth.length}</p>
              <p className="text-sm text-muted-foreground">Pipelines Monitorados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">
                {pipelineHealth.reduce((sum, p) => sum + p.activeLeads, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Leads Ativos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">
                {pipelineHealth.reduce((sum, p) => sum + p.overdueLeads, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Leads Atrasados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {Math.round(pipelineHealth.reduce((sum, p) => sum + p.slaCompliance, 0) / Math.max(pipelineHealth.length, 1))}%
              </p>
              <p className="text-sm text-muted-foreground">SLA Médio</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Health Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pipelineHealth.map(pipeline => {
          const TrendIcon = getTrendIcon(pipeline.trends.leadsChange);
          
          return (
            <Card 
              key={pipeline.pipelineId}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                selectedPipeline === pipeline.pipelineId ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedPipeline(pipeline.pipelineId)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{pipeline.pipelineName}</CardTitle>
                  <Badge variant={getHealthBadgeVariant(pipeline.overallHealth)}>
                    {pipeline.overallHealth}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pontuação de Saúde</span>
                  <span className={`text-lg font-bold ${getHealthColor(pipeline.overallHealth)}`}>
                    {pipeline.healthScore}%
                  </span>
                </div>
                <Progress value={pipeline.healthScore} />
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-semibold">{pipeline.activeLeads}</p>
                    <p className="text-xs text-muted-foreground">Leads Ativos</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <TrendIcon className={`h-3 w-3 ${getTrendColor(pipeline.trends.leadsChange)}`} />
                      <span className={`text-xs ${getTrendColor(pipeline.trends.leadsChange)}`}>
                        {pipeline.trends.leadsChange > 0 ? '+' : ''}{pipeline.trends.leadsChange}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-lg font-semibold">{pipeline.conversionRate}%</p>
                    <p className="text-xs text-muted-foreground">Conversão</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <TrendIcon className={`h-3 w-3 ${getTrendColor(pipeline.trends.conversionChange)}`} />
                      <span className={`text-xs ${getTrendColor(pipeline.trends.conversionChange)}`}>
                        {pipeline.trends.conversionChange > 0 ? '+' : ''}{pipeline.trends.conversionChange}%
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-lg font-semibold">{pipeline.slaCompliance}%</p>
                    <p className="text-xs text-muted-foreground">SLA</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <TrendIcon className={`h-3 w-3 ${getTrendColor(pipeline.trends.slaChange)}`} />
                      <span className={`text-xs ${getTrendColor(pipeline.trends.slaChange)}`}>
                        {pipeline.trends.slaChange > 0 ? '+' : ''}{pipeline.trends.slaChange}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Critical Issues */}
                {pipeline.criticalIssues.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">Issues Críticos</span>
                    </div>
                    <div className="space-y-1">
                      {pipeline.criticalIssues.slice(0, 2).map((issue, index) => (
                        <p key={index} className="text-xs text-muted-foreground">• {issue}</p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed View for Selected Pipeline */}
      {selectedPipeline && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stage Health */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Saúde por Etapa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {stageHealth.map(stage => (
                    <div key={stage.stageId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{stage.stageName}</p>
                          {stage.bottleneck && (
                            <Badge variant="destructive" className="text-xs">
                              Gargalo
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {stage.leadsCount} leads
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {stage.averageTime}d médio
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={stage.healthColor === 'success' ? 'default' : stage.healthColor === 'warning' ? 'secondary' : 'destructive'}>
                          {stage.slaCompliance}% SLA
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* SLA Monitor */}
          <SLAMonitor pipelineId={selectedPipeline} />
        </div>
      )}

      {/* Workflow and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkflowOrchestrator pipelineId={selectedPipeline} />
        <NotificationSystem pipelineId={selectedPipeline} />
      </div>
    </div>
  );
}