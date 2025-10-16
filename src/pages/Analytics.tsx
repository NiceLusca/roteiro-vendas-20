import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BusinessIntelligenceDashboard } from '@/components/analytics/BusinessIntelligenceDashboard';
import { RevenueAnalytics } from '@/components/analytics/RevenueAnalytics';
import { ConversionFunnelAnalytics } from '@/components/analytics/ConversionFunnelAnalytics';

export default function Analytics() {
  return (
    <div className="p-6 h-full overflow-auto">
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Avançado</h1>
        <p className="text-muted-foreground">
          Análise completa de performance, receita e conversão
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Business Intelligence</TabsTrigger>
          <TabsTrigger value="revenue">Análise de Receita</TabsTrigger>
          <TabsTrigger value="funnel">Funil de Conversão</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <BusinessIntelligenceDashboard />
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueAnalytics />
        </TabsContent>

        <TabsContent value="funnel">
          <ConversionFunnelAnalytics />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}