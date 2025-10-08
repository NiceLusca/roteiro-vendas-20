import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';

interface PipelineMetrics {
  totalLeads: number;
  activeLeads: number;
  completedLeads: number;
  conversionRate: number;
  averageTimeInPipeline: number;
  totalValue: number;
  averageValue: number;
}

interface StageMetrics {
  stageId: string;
  stageName: string;
  leadsCount: number;
  averageTimeInStage: number;
  conversionRate: number;
  overdueCount: number;
  healthDistribution: {
    verde: number;
    amarelo: number;
    vermelho: number;
  };
}

interface TimeSeriesData {
  date: string;
  newLeads: number;
  completedLeads: number;
  revenue: number;
}

interface PerformanceData {
  totalPipelines: number;
  totalStages: number;
  totalDeals: number;
  totalRevenue: number;
  monthlyGrowth: number;
  leadsInSLA: number;
  leadsOverdue: number;
}

export function useSupabasePipelineAnalytics(pipelineId?: string, dateRange?: { start: string; end: string }) {
  const [pipelineMetrics, setPipelineMetrics] = useState<PipelineMetrics | null>(null);
  const [stageMetrics, setStageMetrics] = useState<StageMetrics[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch pipeline metrics
  const fetchPipelineMetrics = async () => {
    if (!user) return;

    try {
      // Base query for lead pipeline entries
      let baseQuery = supabase
        .from('lead_pipeline_entries')
        .select(`
          *,
          leads!inner(user_id, nome)
        `)
        .eq('leads.user_id', user.id);

      if (pipelineId) {
        baseQuery = baseQuery.eq('pipeline_id', pipelineId);
      }

      if (dateRange) {
        baseQuery = baseQuery
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }

      const { data: entries, error } = await baseQuery;

      if (error) {
        console.error('Erro ao buscar métricas:', error);
        return;
      }

      // Calculate metrics
      const totalLeads = entries?.length || 0;
      const activeLeads = entries?.filter(e => e.status_inscricao === 'Ativo').length || 0;
      const completedLeads = entries?.filter(e => e.status_inscricao === 'Concluído').length || 0;
      const conversionRate = totalLeads > 0 ? (completedLeads / totalLeads) * 100 : 0;

      // Calculate average time in pipeline (compute from dates)
      const averageTimeInPipeline = entries?.length 
        ? entries.reduce((acc, entry) => {
            const entryDate = new Date(entry.data_entrada_etapa || entry.created_at);
            const daysDiff = Math.floor((Date.now() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
            return acc + daysDiff;
          }, 0) / entries.length 
        : 0;

      // Calculate total and average deal values (without deals table for now)
      const totalValue = 0;
      const averageValue = 0;

      setPipelineMetrics({
        totalLeads,
        activeLeads,
        completedLeads,
        conversionRate,
        averageTimeInPipeline: Math.round(averageTimeInPipeline),
        totalValue,
        averageValue
      });

    } catch (error) {
      console.error('Erro ao calcular métricas:', error);
    }
  };

  // Fetch stage metrics
  const fetchStageMetrics = async () => {
    if (!user) return;

    try {
      // Get stages for the pipeline
      let stagesQuery = supabase
        .from('pipeline_stages')
        .select(`
          *,
          pipelines!inner(user_id)
        `)
        .eq('pipelines.user_id', user.id);

      if (pipelineId) {
        stagesQuery = stagesQuery.eq('pipeline_id', pipelineId);
      }

      const { data: stages, error: stagesError } = await stagesQuery;

      if (stagesError) {
        console.error('Erro ao buscar etapas:', stagesError);
        return;
      }

      const metricsPromises = stages?.map(async (stage) => {
        // Get entries for this stage
        const { data: entries } = await supabase
          .from('lead_pipeline_entries')
          .select(`
            *,
            leads!inner(user_id)
          `)
          .eq('leads.user_id', user.id)
          .eq('etapa_atual_id', stage.id)
          .eq('status_inscricao', 'Ativo');

        const leadsCount = entries?.length || 0;
        const averageTimeInStage = entries?.length 
          ? entries.reduce((acc, entry) => {
              const entryDate = new Date(entry.data_entrada_etapa || entry.created_at);
              const daysDiff = Math.floor((Date.now() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
              return acc + daysDiff;
            }, 0) / entries.length 
          : 0;
        
        const overdueCount = 0; // Compute if needed based on SLA
        
        // Health distribution
        const healthDistribution = {
          verde: entries?.filter(e => e.saude_etapa === 'Verde').length || 0,
          amarelo: entries?.filter(e => e.saude_etapa === 'Amarelo').length || 0,
          vermelho: entries?.filter(e => e.saude_etapa === 'Vermelho').length || 0
        };

        return {
          stageId: stage.id,
          stageName: stage.nome,
          leadsCount,
          averageTimeInStage: Math.round(averageTimeInStage),
          conversionRate: 0, // Would need more complex calculation
          overdueCount,
          healthDistribution
        };
      }) || [];

      const metrics = await Promise.all(metricsPromises);
      setStageMetrics(metrics);

    } catch (error) {
      console.error('Erro ao calcular métricas de etapas:', error);
    }
  };

  // Fetch time series data
  const fetchTimeSeriesData = async () => {
    if (!user) return;

    try {
      // Get data for the last 30 days
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 30);

      const { data: entries } = await supabase
        .from('lead_pipeline_entries')
        .select(`
          created_at,
          status_inscricao,
          leads!inner(user_id)
        `)
        .eq('leads.user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Group by date
      const dateGroups: { [key: string]: any[] } = {};
      entries?.forEach(entry => {
        const date = entry.created_at.split('T')[0];
        if (!dateGroups[date]) {
          dateGroups[date] = [];
        }
        dateGroups[date].push(entry);
      });

      const timeSeriesData = Object.entries(dateGroups).map(([date, entries]) => ({
        date,
        newLeads: entries.length,
        completedLeads: entries.filter(e => e.status_inscricao === 'Concluído').length,
        revenue: 0 // Without deals table for now
      }));

      setTimeSeriesData(timeSeriesData.sort((a, b) => a.date.localeCompare(b.date)));

    } catch (error) {
      console.error('Erro ao buscar dados de série temporal:', error);
    }
  };

  // Fetch overall performance data
  const fetchPerformanceData = async () => {
    if (!user) return;

    try {
      // Get overall counts
      const [pipelinesResult, stagesResult, entriesResult] = await Promise.all([
        supabase.from('pipelines').select('id', { count: 'exact' }),
        supabase.from('pipeline_stages').select('id', { count: 'exact' }),
        supabase.from('lead_pipeline_entries').select('*')
      ]);

      const totalPipelines = pipelinesResult.count || 0;
      const totalStages = stagesResult.count || 0;
      const totalDeals = 0; // Without deals table for now
      
      // Calculate total revenue (without deals table for now)
      const totalRevenue = 0;

      // Calculate SLA metrics (simplified - compute if needed)
      const entries = entriesResult.data || [];
      const leadsInSLA = entries.filter(e => e.status_inscricao === 'Ativo').length;
      const leadsOverdue = 0;

      setPerformanceData({
        totalPipelines,
        totalStages,
        totalDeals,
        totalRevenue,
        monthlyGrowth: 0, // Would need historical data
        leadsInSLA,
        leadsOverdue
      });

    } catch (error) {
      console.error('Erro ao buscar dados de performance:', error);
    }
  };

  // Fetch all analytics data
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPipelineMetrics(),
        fetchStageMetrics(),
        fetchTimeSeriesData(),
        fetchPerformanceData()
      ]);
    } catch (error) {
      console.error('Erro ao buscar analytics:', error);
      toast({
        title: "Erro ao carregar relatórios",
        description: "Não foi possível carregar os dados de analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, pipelineId, dateRange]);

  return {
    pipelineMetrics,
    stageMetrics,
    timeSeriesData,
    performanceData,
    loading,
    refetch: fetchAnalytics
  };
}