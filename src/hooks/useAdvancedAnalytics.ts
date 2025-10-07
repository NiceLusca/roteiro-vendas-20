import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lead, Deal, Order } from '@/types/crm';

interface AnalyticsMetrics {
  totalLeads: number;
  totalRevenue: number;
  conversionRate: number;
  avgDealSize: number;
  pipelineHealth: 'excellent' | 'good' | 'warning' | 'critical';
  monthlyGrowth: number;
  leadSources: Array<{ source: string; count: number; percentage: number }>;
  stagePerformance: Array<{ stage: string; avgTime: number; conversionRate: number }>;
  revenueByPeriod: Array<{ period: string; revenue: number }>;
  topPerformers: Array<{ closer: string; deals: number; revenue: number }>;
}

interface ForecastData {
  predictedRevenue: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  factors: string[];
}

export function useAdvancedAnalytics(dateRange?: { start: Date; end: Date }) {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Base date filter
      const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = dateRange?.end || new Date();

      // Fetch leads data
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (leadsError) throw leadsError;

      // Fetch deals data
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('*, leads!inner(*)')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (dealsError) throw dealsError;

      // Fetch orders data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*, leads!inner(*)')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (ordersError) throw ordersError;

      // Fetch pipeline entries for stage performance
      const { data: pipelineEntries, error: pipelineError } = await supabase
        .from('lead_pipeline_entries')
        .select('*, pipeline_stages!inner(nome), leads!inner(*)')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (pipelineError) throw pipelineError;

      // Calculate metrics
      const totalLeads = leads?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.valor_total || 0), 0) || 0;
      const wonDeals = deals?.filter(deal => deal.status === 'ganho') || [];
      const conversionRate = totalLeads > 0 ? (wonDeals.length / totalLeads) * 100 : 0;
      const avgDealSize = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;

      // Lead sources analysis
      const sourceCounts = leads?.reduce((acc: Record<string, number>, lead) => {
        const source = lead.origem || 'Desconhecido';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {}) || {};

      const leadSources = Object.entries(sourceCounts).map(([source, count]) => ({
        source,
        count,
        percentage: totalLeads > 0 ? (count / totalLeads) * 100 : 0
      }));

      // Stage performance analysis
      const stageStats = pipelineEntries?.reduce((acc: Record<string, { total: number; avgTime: number; conversions: number }>, entry) => {
        const stageName = entry.pipeline_stages?.nome || 'Desconhecido';
        if (!acc[stageName]) {
          acc[stageName] = { total: 0, avgTime: 0, conversions: 0 };
        }
        acc[stageName].total += 1;
        const timeInStage = Math.floor((new Date().getTime() - new Date(entry.data_entrada_etapa).getTime()) / (1000 * 60 * 60 * 24));
        acc[stageName].avgTime += timeInStage;
        return acc;
      }, {}) || {};

      const stagePerformance = Object.entries(stageStats).map(([stage, stats]) => ({
        stage,
        avgTime: stats.total > 0 ? stats.avgTime / stats.total : 0,
        conversionRate: stats.total > 0 ? (stats.conversions / stats.total) * 100 : 0
      }));

      // Revenue by period (weekly)
      const revenueByPeriod = generateWeeklyRevenue(orders || []);

      // Top performers
      const performerStats = orders?.reduce((acc: Record<string, { deals: number; revenue: number }>, order) => {
        const closer = order.closer || 'Desconhecido';
        if (!acc[closer]) {
          acc[closer] = { deals: 0, revenue: 0 };
        }
        acc[closer].deals += 1;
        acc[closer].revenue += Number(order.valor_total || 0);
        return acc;
      }, {}) || {};

      const topPerformers = Object.entries(performerStats)
        .map(([closer, stats]) => ({ closer, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Pipeline health calculation
      const avgStageTime = stagePerformance.reduce((sum, stage) => sum + stage.avgTime, 0) / stagePerformance.length;
      const pipelineHealth = calculatePipelineHealth(conversionRate, avgStageTime, totalLeads);

      // Monthly growth calculation
      const monthlyGrowth = calculateMonthlyGrowth(orders || []);

      setMetrics({
        totalLeads,
        totalRevenue,
        conversionRate,
        avgDealSize,
        pipelineHealth,
        monthlyGrowth,
        leadSources,
        stagePerformance,
        revenueByPeriod,
        topPerformers
      });

      // Generate forecast
      const forecastData = generateForecast(orders || [], leads || []);
      setForecast(forecastData);

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const refetch = () => {
    fetchAnalytics();
  };

  return {
    metrics,
    forecast,
    loading,
    error,
    refetch
  };
}

function generateWeeklyRevenue(orders: any[]): Array<{ period: string; revenue: number }> {
  const weeklyData: Record<string, number> = {};
  
  orders.forEach(order => {
    const date = new Date(order.created_at);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    weeklyData[weekKey] = (weeklyData[weekKey] || 0) + Number(order.valor_total || 0);
  });

  return Object.entries(weeklyData)
    .map(([period, revenue]) => ({ period, revenue }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

function calculatePipelineHealth(conversionRate: number, avgStageTime: number, totalLeads: number): 'excellent' | 'good' | 'warning' | 'critical' {
  if (conversionRate > 20 && avgStageTime < 7 && totalLeads > 50) return 'excellent';
  if (conversionRate > 15 && avgStageTime < 14 && totalLeads > 20) return 'good';
  if (conversionRate > 10 && avgStageTime < 21) return 'warning';
  return 'critical';
}

function calculateMonthlyGrowth(orders: any[]): number {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const lastMonthRevenue = orders
    .filter(order => new Date(order.created_at) >= lastMonth && new Date(order.created_at) < thisMonth)
    .reduce((sum, order) => sum + Number(order.valor_total || 0), 0);

  const thisMonthRevenue = orders
    .filter(order => new Date(order.created_at) >= thisMonth)
    .reduce((sum, order) => sum + Number(order.valor_total || 0), 0);

  if (lastMonthRevenue === 0) return 0;
  return ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
}

function generateForecast(orders: any[], leads: any[]): ForecastData {
  const recentOrders = orders.slice(-30); // Last 30 orders
  const avgOrderValue = recentOrders.reduce((sum, order) => sum + Number(order.valor_total || 0), 0) / recentOrders.length;
  const recentLeads = leads.slice(-30); // Last 30 leads
  
  const trend = recentOrders.length > orders.length / 2 ? 'up' : 
                recentOrders.length < orders.length / 3 ? 'down' : 'stable';
  
  const predictedRevenue = avgOrderValue * recentLeads.length * 0.15; // Assuming 15% conversion
  const confidence = Math.min(90, Math.max(60, (recentOrders.length / 30) * 100));
  
  const factors = [
    trend === 'up' ? 'Tendência de crescimento positiva' : 'Tendência estável',
    `Valor médio por pedido: R$ ${avgOrderValue.toFixed(2)}`,
    `${recentLeads.length} leads recentes no pipeline`
  ];

  return {
    predictedRevenue,
    confidence,
    trend,
    factors
  };
}