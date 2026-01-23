import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PipelineAnalyticsDashboard } from '@/components/reports/PipelineAnalyticsDashboard';
import { RealtimeMetrics } from '@/components/reports/RealtimeMetrics';
import { DataExport } from '@/components/reports/DataExport';
import { BusinessIntelligenceDashboard } from '@/components/analytics/BusinessIntelligenceDashboard';
import { RevenueAnalytics } from '@/components/analytics/RevenueAnalytics';
import { ConversionFunnelAnalytics } from '@/components/analytics/ConversionFunnelAnalytics';
import { BarChart3, TrendingUp, DollarSign, Filter, Download } from 'lucide-react';

export default function Reports() {
  return (
    <div className="p-6 h-full overflow-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Relatórios & Analytics</h1>
          <p className="text-muted-foreground">
            Métricas em tempo real, análise de receita e funil de conversão
          </p>
        </div>

        <Tabs defaultValue="realtime" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="realtime" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Tempo Real
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="revenue" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Receita
            </TabsTrigger>
            <TabsTrigger value="funnel" className="gap-2">
              <Filter className="w-4 h-4" />
              Funil
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="realtime">
            <RealtimeMetrics />
          </TabsContent>

          <TabsContent value="pipeline">
            <PipelineAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="revenue">
            <RevenueAnalytics />
          </TabsContent>

          <TabsContent value="funnel">
            <ConversionFunnelAnalytics />
          </TabsContent>

          <TabsContent value="export">
            <DataExport />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}