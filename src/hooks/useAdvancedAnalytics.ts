import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface KPIMetric {
  metric: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface InsightData {
  type: 'opportunity' | 'warning' | 'info';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export function useAdvancedAnalytics(selectedPipelineId: string, timeRange: string) {
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch data with simplified queries
      const startIso = startDate.toISOString();
      const endIso = endDate.toISOString();

       // Get leads data  
       const leadsData: any[] = [];
       
        if (selectedPipelineId !== 'all') {
          // Get leads through pipeline entries
          const { data: pipelineEntries } = await supabase
            .from('lead_pipeline_entries')
            .select(`
              lead_id,
              leads!inner(*)
            `)
            .eq('pipeline_id', selectedPipelineId)
            .gte('leads.created_at', startIso)
            .lte('leads.created_at', endIso);
          
          const leads = pipelineEntries?.map(entry => entry.leads).filter(Boolean) || [];
          leadsData.push(...leads);
        } else {
          const { data: leads } = await supabase
            .from('leads')
            .select('*')
            .gte('created_at', startIso)
            .lte('created_at', endIso);
          
          leadsData.push(...(leads || []));
        }

      // Get deals and orders
      const dealsResponse = await supabase
        .from('deals')
        .select('*')
        .gte('created_at', startIso)
        .lte('created_at', endIso);

      const ordersResponse = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startIso)
        .lte('created_at', endIso);

      if (dealsResponse.error) throw dealsResponse.error;
      if (ordersResponse.error) throw ordersResponse.error;

      const dealsData = dealsResponse.data || [];
      const ordersData = ordersResponse.data || [];

      // Calculate previous period for comparison
      const previousStartDate = new Date(startDate);
      const periodLength = endDate.getTime() - startDate.getTime();
      previousStartDate.setTime(startDate.getTime() - periodLength);

      const previousLeadsResponse = await supabase
        .from('leads')
        .select('id')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      const previousOrdersResponse = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      const previousLeads = previousLeadsResponse.data || [];
      const previousOrders = previousOrdersResponse.data || [];

      // Calculate KPI metrics
      const totalLeads = leadsData.length;
      const totalRevenue = ordersData.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);
      const wonDeals = dealsData.filter((deal: any) => deal.status === 'Ganha');
      const conversionRate = totalLeads > 0 ? (wonDeals.length / totalLeads) * 100 : 0;
      
      const previousTotalLeads = previousLeads.length;
      const previousTotalRevenue = previousOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);
      
      const leadGrowth = previousTotalLeads > 0 ? 
        ((totalLeads - previousTotalLeads) / previousTotalLeads) * 100 : 0;
      const revenueGrowth = previousTotalRevenue > 0 ? 
        ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100 : 0;

      // Calculate pipeline velocity (average days in pipeline)
      const pipelineVelocity = leadsData.reduce((sum: number, lead: any) => {
        const created = new Date(lead.created_at);
        const now = new Date();
        return sum + Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      }, 0) / (totalLeads || 1);

      const kpiData: KPIMetric[] = [
        {
          metric: 'total_revenue',
          value: totalRevenue.toFixed(0),
          change: revenueGrowth,
          trend: revenueGrowth > 0 ? 'up' : revenueGrowth < 0 ? 'down' : 'stable'
        },
        {
          metric: 'conversion_rate',
          value: conversionRate.toFixed(1),
          change: 0, // Would need historical data
          trend: 'stable'
        },
        {
          metric: 'active_leads',
          value: totalLeads,
          change: leadGrowth,
          trend: leadGrowth > 0 ? 'up' : leadGrowth < 0 ? 'down' : 'stable'
        },
        {
          metric: 'pipeline_velocity',
          value: pipelineVelocity.toFixed(1),
          change: 0, // Would need historical comparison
          trend: 'stable'
        }
      ];

      setKpiMetrics(kpiData);

      // Generate insights based on data
      const generatedInsights: InsightData[] = [];

      if (conversionRate < 10) {
        generatedInsights.push({
          type: 'warning',
          title: 'Taxa de conversão baixa',
          description: `A taxa de conversão atual de ${conversionRate.toFixed(1)}% está abaixo do ideal. Considere revisar a qualificação de leads.`,
          priority: 'high'
        });
      }

      if (pipelineVelocity > 30) {
        generatedInsights.push({
          type: 'opportunity',
          title: 'Oportunidade de otimização',
          description: `O tempo médio no pipeline é de ${pipelineVelocity.toFixed(0)} dias. Considere implementar automações para acelerar o processo.`,
          priority: 'medium'
        });
      }

      if (revenueGrowth > 20) {
        generatedInsights.push({
          type: 'opportunity',
          title: 'Crescimento acelerado',
          description: `A receita cresceu ${revenueGrowth.toFixed(1)}% no período. Considere expandir a equipe de vendas.`,
          priority: 'high'
        });
      }

      if (totalLeads === 0) {
        generatedInsights.push({
          type: 'warning',
          title: 'Sem leads no período',
          description: 'Não foram encontrados leads no período selecionado. Verifique suas campanhas de aquisição.',
          priority: 'high'
        });
      }

      setInsights(generatedInsights);

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar analytics');
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    await fetchAnalytics();
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPipelineId, timeRange]);

  return {
    kpiMetrics,
    insights,
    loading,
    error,
    refreshAnalytics
  };
}