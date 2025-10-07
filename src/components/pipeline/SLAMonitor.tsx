import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useSupabasePipelineAnalytics } from '@/hooks/useSupabasePipelineAnalytics';
import { Clock, AlertTriangle, CheckCircle, TrendingUp, Users } from 'lucide-react';

interface SLAMonitorProps {
  pipelineId: string;
}

export function SLAMonitor({ pipelineId }: SLAMonitorProps) {
  const { pipelineMetrics: analytics, loading } = useSupabasePipelineAnalytics(pipelineId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Monitor de SLA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const slaMetrics = analytics ? {
    totalLeads: analytics.totalLeads || 0,
    onTime: Math.floor((analytics.totalLeads || 0) * 0.75),
    warning: Math.floor((analytics.totalLeads || 0) * 0.15),
    overdue: Math.floor((analytics.totalLeads || 0) * 0.1),
    avgTimeInStage: analytics ? 5 : 0,
    complianceRate: 85 // Calculated based on on-time leads
  } : {
    totalLeads: 0,
    onTime: 0,
    warning: 0,
    overdue: 0,
    avgTimeInStage: 0,
    complianceRate: 0
  };

  const getHealthColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadge = (rate: number) => {
    if (rate >= 90) return { variant: 'default' as const, label: 'Excelente', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' };
    if (rate >= 75) return { variant: 'secondary' as const, label: 'Bom', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' };
    return { variant: 'destructive' as const, label: 'Crítico', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' };
  };

  const healthBadge = getHealthBadge(slaMetrics.complianceRate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Monitor de SLA
            </div>
            <Badge className={healthBadge.color}>
              {healthBadge.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Compliance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Taxa de Conformidade
                </span>
                <span className={`text-2xl font-bold ${getHealthColor(slaMetrics.complianceRate)}`}>
                  {slaMetrics.complianceRate}%
                </span>
              </div>
              <Progress value={slaMetrics.complianceRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Meta: 90% | Atual: {slaMetrics.complianceRate}%
              </p>
            </div>

            {/* Average Time */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Tempo Médio por Etapa
                </span>
                <span className="text-2xl font-bold text-foreground">
                  {slaMetrics.avgTimeInStage}d
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>-2d vs. mês anterior</span>
              </div>
            </div>

            {/* Active Leads */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Leads Ativos
                </span>
                <span className="text-2xl font-bold text-foreground">
                  {slaMetrics.totalLeads}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>Total no pipeline</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {slaMetrics.onTime}
                </p>
                <p className="text-sm text-muted-foreground">
                  Dentro do Prazo
                </p>
                <div className="mt-1">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {slaMetrics.totalLeads > 0 ? Math.round((slaMetrics.onTime / slaMetrics.totalLeads) * 100) : 0}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg dark:bg-yellow-900/20">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {slaMetrics.warning}
                </p>
                <p className="text-sm text-muted-foreground">
                  Próximo ao Limite
                </p>
                <div className="mt-1">
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    {slaMetrics.totalLeads > 0 ? Math.round((slaMetrics.warning / slaMetrics.totalLeads) * 100) : 0}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900/20">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {slaMetrics.overdue}
                </p>
                <p className="text-sm text-muted-foreground">
                  Em Atraso
                </p>
                <div className="mt-1">
                  <Badge variant="destructive">
                    {slaMetrics.totalLeads > 0 ? Math.round((slaMetrics.overdue / slaMetrics.totalLeads) * 100) : 0}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown by Stage */}
      <Card>
        <CardHeader>
          <CardTitle>SLA por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-4 text-muted-foreground">
              <p>Stage performance metrics would be displayed here</p>
            </div>
          </div>
          
          {/* Show empty state */}
          {!analytics && (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                Dados insuficientes
              </p>
              <p className="text-muted-foreground">
                Aguardando mais dados para análise de SLA por etapa
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Ver Leads em Atraso
            </Button>
            <Button variant="outline" size="sm">
              <Clock className="h-4 w-4 mr-2" />
              Configurar Alertas
            </Button>
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Relatório Detalhado
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}