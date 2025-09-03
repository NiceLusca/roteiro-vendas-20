import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, TrendingUp, TrendingDown, Clock, Users, AlertTriangle } from 'lucide-react';
import { EmbeddedPipelineAnalytics } from '@/components/analytics/EmbeddedPipelineAnalytics';

interface StageAnalyticsButtonProps {
  stageId: string;
  stageName: string;
  pipelineId: string;
  stageMetrics?: {
    leadsCount: number;
    conversionRate: number;
    avgTimeInStage: number;
    slaViolations: number;
    health: 'green' | 'yellow' | 'red';
    trend: 'up' | 'down' | 'stable';
  };
  compact?: boolean;
}

const mockStageMetrics = {
  leadsCount: 23,
  conversionRate: 65,
  avgTimeInStage: 4.2,
  slaViolations: 3,
  health: 'yellow' as const,
  trend: 'up' as const
};

export function StageAnalyticsButton({ 
  stageId, 
  stageName, 
  pipelineId,
  stageMetrics = mockStageMetrics,
  compact = false
}: StageAnalyticsButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'green': return 'text-success bg-success/10 border-success/20';
      case 'yellow': return 'text-warning bg-warning/10 border-warning/20';
      case 'red': return 'text-destructive bg-destructive/10 border-destructive/20';
      default: return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-success" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-destructive" />;
      default: return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (compact) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 px-2 relative"
          >
            <BarChart3 className="h-3 w-3" />
            <Badge 
              variant="outline" 
              className={`absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] rounded-full ${getHealthColor(stageMetrics.health)}`}
            >
              {stageMetrics.leadsCount}
            </Badge>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics da Etapa - {stageName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <EmbeddedPipelineAnalytics
              pipelineId={pipelineId}
              pipelineName={`Etapa: ${stageName}`}
              showHeader={false}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="space-y-2">
      {/* Quick Metrics Card */}
      <Card className="border border-border/50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">Métricas da Etapa</span>
            </div>
            <Badge 
              variant="outline" 
              className={`text-xs ${getHealthColor(stageMetrics.health)}`}
            >
              {stageMetrics.health === 'green' ? 'Saudável' :
               stageMetrics.health === 'yellow' ? 'Atenção' : 'Crítico'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="h-3 w-3 text-secondary" />
                <span className="text-lg font-bold text-secondary">{stageMetrics.leadsCount}</span>
                {getTrendIcon(stageMetrics.trend)}
              </div>
              <p className="text-xs text-muted-foreground">Leads</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-lg font-bold text-primary">{stageMetrics.conversionRate}%</span>
              </div>
              <p className="text-xs text-muted-foreground">Conversão</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium">{stageMetrics.avgTimeInStage}d</span>
              </div>
              <p className="text-xs text-muted-foreground">Tempo Médio</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <span className="text-sm font-medium">{stageMetrics.slaViolations}</span>
              </div>
              <p className="text-xs text-muted-foreground">SLA Quebrados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics Button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full h-8 text-xs">
            <BarChart3 className="h-3 w-3 mr-1" />
            Ver Analytics Detalhado
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics da Etapa - {stageName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <EmbeddedPipelineAnalytics
              pipelineId={pipelineId}
              pipelineName={`Etapa: ${stageName}`}
              showHeader={false}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}