import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextSecure';
import { formatCurrency } from '@/utils/formatters';

interface RealtimeData {
  newLeadsToday: number;
  activeDeals: number;
  completedToday: number;
  revenueToday: number;
  lastUpdate: Date;
}

export function RealtimeMetrics() {
  const [data, setData] = useState<RealtimeData>({
    newLeadsToday: 0,
    activeDeals: 0,
    completedToday: 0,
    revenueToday: 0,
    lastUpdate: new Date()
  });
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCurrentData = async () => {
    if (!user) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Fetch today's new leads
      const { data: newLeads } = await supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('created_at', todayISO);

      // Fetch active deals
      const { data: activeDeals } = await supabase
        .from('deals')
        .select('id', { count: 'exact' })
        .eq('leads.user_id', user.id)
        .eq('status', 'Aberta');

      // Fetch today's completed deals
      const { data: completedDeals } = await supabase
        .from('deals')
        .select('valor_proposto', { count: 'exact' })
        .eq('leads.user_id', user.id)
        .eq('status', 'Ganha')
        .gte('updated_at', todayISO);

      // Calculate today's revenue
      const { data: revenueData } = await supabase
        .from('deals')
        .select('valor_proposto')
        .eq('leads.user_id', user.id)
        .eq('status', 'Ganha')
        .gte('updated_at', todayISO);

      const revenueToday = revenueData?.reduce((sum, deal) => sum + (deal.valor_proposto || 0), 0) || 0;

      setData({
        newLeadsToday: newLeads?.length || 0,
        activeDeals: activeDeals?.length || 0,
        completedToday: completedDeals?.length || 0,
        revenueToday,
        lastUpdate: new Date()
      });
    } catch (error) {
      console.error('Erro ao buscar dados em tempo real:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Initial data fetch
    fetchCurrentData();

    // Set up realtime subscriptions
    const leadsChannel = supabase
      .channel('leads-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchCurrentData();
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    const dealsChannel = supabase
      .channel('deals-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals'
        },
        () => {
          fetchCurrentData();
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(dealsChannel);
    };
  }, [user]);

  // Auto-refresh every 30 seconds as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCurrentData();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Métricas em Tempo Real
          </div>
          <div className="flex items-center gap-2">
            {connected ? (
              <Badge variant="default" className="flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                Desconectado
              </Badge>
            )}
            {loading && (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Última atualização: {data.lastUpdate.toLocaleTimeString('pt-BR')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-primary/5 rounded-lg">
            <p className="text-2xl font-bold text-primary">{data.newLeadsToday}</p>
            <p className="text-sm text-muted-foreground">Novos Leads Hoje</p>
          </div>
          
          <div className="text-center p-4 bg-warning/5 rounded-lg">
            <p className="text-2xl font-bold text-warning">{data.activeDeals}</p>
            <p className="text-sm text-muted-foreground">Deals Ativos</p>
          </div>
          
          <div className="text-center p-4 bg-success/5 rounded-lg">
            <p className="text-2xl font-bold text-success">{data.completedToday}</p>
            <p className="text-sm text-muted-foreground">Fechados Hoje</p>
          </div>
          
          <div className="text-center p-4 bg-success/5 rounded-lg">
            <p className="text-lg font-bold text-success">{formatCurrency(data.revenueToday)}</p>
            <p className="text-sm text-muted-foreground">Receita Hoje</p>
          </div>
        </div>

        {/* Status indicators */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Atualização automática a cada 30s</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-success animate-pulse' : 'bg-muted'}`} />
            <span>{connected ? 'Tempo real ativo' : 'Sem conexão tempo real'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}