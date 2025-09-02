import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingDown, Users, ArrowDown } from 'lucide-react';

interface FunnelData {
  stageId: string;
  stageName: string;
  leadsCount: number;
  conversionRate: number;
  dropOffRate: number;
  ordem: number;
}

interface ConversionFunnelChartProps {
  data: FunnelData[];
  totalLeads: number;
}

export function ConversionFunnelChart({ data, totalLeads }: ConversionFunnelChartProps) {
  const sortedData = [...data].sort((a, b) => a.ordem - b.ordem);
  const maxWidth = 100; // Maximum width percentage for the funnel

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Funil de Conversão
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Visualize como os leads progridem através das etapas do pipeline
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedData.map((stage, index) => {
            const widthPercentage = totalLeads > 0 ? (stage.leadsCount / totalLeads) * maxWidth : 0;
            const isFirst = index === 0;
            const isLast = index === sortedData.length - 1;
            const previousStage = index > 0 ? sortedData[index - 1] : null;
            const dropOff = previousStage ? previousStage.leadsCount - stage.leadsCount : 0;
            const dropOffRate = previousStage && previousStage.leadsCount > 0 
              ? ((dropOff / previousStage.leadsCount) * 100) 
              : 0;

            return (
              <div key={stage.stageId} className="space-y-2">
                {/* Drop-off indicator */}
                {!isFirst && dropOff > 0 && (
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                      <ArrowDown className="h-3 w-3" />
                      <span>{dropOff} leads perdidos ({dropOffRate.toFixed(1)}%)</span>
                    </div>
                  </div>
                )}

                {/* Funnel stage */}
                <div className="relative">
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-transparent">
                    {/* Funnel visual */}
                    <div className="relative flex-1">
                      <div 
                        className="h-12 bg-primary/20 rounded-lg relative overflow-hidden"
                        style={{ 
                          width: `${Math.max(widthPercentage, 20)}%`,
                          margin: '0 auto'
                        }}
                      >
                        <div 
                          className="h-full bg-primary/40 rounded-lg transition-all duration-300"
                          style={{ width: '100%' }}
                        />
                        
                        {/* Stage info overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-sm font-medium text-primary">
                              {stage.stageName}
                            </p>
                            <div className="flex items-center gap-2 justify-center mt-1">
                              <Users className="h-3 w-3" />
                              <span className="text-xs font-semibold">
                                {stage.leadsCount}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex flex-col items-end gap-1 min-w-32">
                      <Badge variant="outline" className="text-xs">
                        {((stage.leadsCount / totalLeads) * 100).toFixed(1)}% do total
                      </Badge>
                      {stage.conversionRate > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {stage.conversionRate.toFixed(1)}% conversão
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Summary */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-3">Resumo do Funil</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Leads Iniciais</p>
                <p className="font-semibold text-lg">{totalLeads}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Leads Finais</p>
                <p className="font-semibold text-lg">
                  {sortedData.length > 0 ? sortedData[sortedData.length - 1].leadsCount : 0}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Taxa Global</p>
                <p className="font-semibold text-lg text-success">
                  {totalLeads > 0 && sortedData.length > 0 
                    ? ((sortedData[sortedData.length - 1].leadsCount / totalLeads) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Perdido</p>
                <p className="font-semibold text-lg text-destructive">
                  {totalLeads - (sortedData.length > 0 ? sortedData[sortedData.length - 1].leadsCount : 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Conversion rate progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Taxa de Conversão Geral</span>
              <span className="font-medium">
                {totalLeads > 0 && sortedData.length > 0 
                  ? ((sortedData[sortedData.length - 1].leadsCount / totalLeads) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            <Progress 
              value={totalLeads > 0 && sortedData.length > 0 
                ? (sortedData[sortedData.length - 1].leadsCount / totalLeads) * 100
                : 0
              } 
              className="h-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}