import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { useSupabaseLeadPipelineEntries } from '@/hooks/useSupabaseLeadPipelineEntries';
import { useSupabasePipelineStages } from '@/hooks/useSupabasePipelineStages';

interface SLAMetrics {
  totalEntries: number;
  onTime: number;
  warning: number;
  overdue: number;
  averageDaysInStage: number;
}

interface SLAMonitorProps {
  pipelineId: string;
  stageId?: string;
}

export function SLAMonitor({ pipelineId, stageId }: SLAMonitorProps) {
  const { entries, updateHealthStatus } = useSupabaseLeadPipelineEntries(pipelineId);
  const { stages } = useSupabasePipelineStages(pipelineId);
  const [metrics, setMetrics] = useState<SLAMetrics>({
    totalEntries: 0,
    onTime: 0,
    warning: 0,
    overdue: 0,
    averageDaysInStage: 0
  });

  useEffect(() => {
    calculateMetrics();
  }, [entries, stages]);

  const calculateMetrics = () => {
    let filteredEntries = entries.filter(entry => entry.status_inscricao === 'Ativo');
    
    if (stageId) {
      filteredEntries = filteredEntries.filter(entry => entry.etapa_atual_id === stageId);
    }

    const totalEntries = filteredEntries.length;
    let onTime = 0;
    let warning = 0;
    let overdue = 0;
    let totalDays = 0;

    filteredEntries.forEach(entry => {
      const stage = stages.find(s => s.id === entry.etapa_atual_id);
      if (!stage) return;

      const daysInStage = entry.tempo_em_etapa_dias;
      const slaLimit = stage.prazo_em_dias;
      const warningThreshold = Math.floor(slaLimit * 0.8); // 80% of SLA

      totalDays += daysInStage;

      if (daysInStage > slaLimit) {
        overdue++;
        // Update health to red if overdue
        if (entry.saude_etapa !== 'Vermelho') {
          updateHealthStatus(entry.id, 'Vermelho');
        }
      } else if (daysInStage >= warningThreshold) {
        warning++;
        // Update health to yellow if in warning zone
        if (entry.saude_etapa !== 'Amarelo') {
          updateHealthStatus(entry.id, 'Amarelo');
        }
      } else {
        onTime++;
        // Update health to green if on time
        if (entry.saude_etapa !== 'Verde') {
          updateHealthStatus(entry.id, 'Verde');
        }
      }
    });

    setMetrics({
      totalEntries,
      onTime,
      warning,
      overdue,
      averageDaysInStage: totalEntries > 0 ? Math.round(totalDays / totalEntries) : 0
    });
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'Verde': return 'text-success';
      case 'Amarelo': return 'text-warning';
      case 'Vermelho': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getHealthBadgeVariant = (health: string) => {
    switch (health) {
      case 'Verde': return 'default';
      case 'Amarelo': return 'secondary';
      case 'Vermelho': return 'destructive';
      default: return 'outline';
    }
  };

  const onTimePercentage = metrics.totalEntries > 0 ? (metrics.onTime / metrics.totalEntries) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{metrics.totalEntries}</p>
                <p className="text-xs text-muted-foreground">Total de Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <div>
                <p className="text-2xl font-bold text-success">{metrics.onTime}</p>
                <p className="text-xs text-muted-foreground">No Prazo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <div>
                <p className="text-2xl font-bold text-warning">{metrics.warning}</p>
                <p className="text-xs text-muted-foreground">Atenção</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-destructive">{metrics.overdue}</p>
                <p className="text-xs text-muted-foreground">Atrasados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance SLA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Leads no Prazo</span>
              <span>{Math.round(onTimePercentage)}%</span>
            </div>
            <Progress value={onTimePercentage} />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <p className="text-lg font-semibold text-success">{metrics.onTime}</p>
              <p className="text-xs text-muted-foreground">Verde</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-warning">{metrics.warning}</p>
              <p className="text-xs text-muted-foreground">Amarelo</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-destructive">{metrics.overdue}</p>
              <p className="text-xs text-muted-foreground">Vermelho</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-sm text-muted-foreground">Tempo Médio na Etapa</span>
            <Badge variant="outline">
              {metrics.averageDaysInStage} dias
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {metrics.overdue > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Leads Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {metrics.overdue} lead(s) estão atrasados e precisam de atenção imediata.
            </p>
            <div className="space-y-2">
              {entries
                .filter(entry => entry.dias_em_atraso > 0 && entry.status_inscricao === 'Ativo')
                .slice(0, 5)
                .map(entry => {
                  const stage = stages.find(s => s.id === entry.etapa_atual_id);
                  return (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">Lead ID: {entry.lead_id}</p>
                        <p className="text-xs text-muted-foreground">
                          {stage?.nome} • {entry.dias_em_atraso} dias de atraso
                        </p>
                      </div>
                      <Badge variant="destructive">{entry.saude_etapa}</Badge>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}