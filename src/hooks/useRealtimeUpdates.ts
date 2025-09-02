import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface RealtimeConfig {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
  filter?: string;
}

interface RealtimeUpdateData {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: any;
  old: any;
  table: string;
  timestamp: Date;
}

export function useRealtimeUpdates(
  configs: RealtimeConfig[],
  onUpdate?: (data: RealtimeUpdateData) => void,
  enabled: boolean = true
) {
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!enabled || !user || configs.length === 0) {
      return;
    }

    // Create a unique channel name
    const channelName = `realtime-updates-${Date.now()}`;
    const channel = supabase.channel(channelName);

      // Subscribe to each configuration
      configs.forEach(config => {
        const channelOn = channel.on(
          'postgres_changes' as any,
          {
            event: config.event || '*',
            schema: config.schema || 'public',
            table: config.table,
            filter: config.filter
          },
          (payload: any) => {
          const updateData: RealtimeUpdateData = {
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new,
            old: payload.old,
            table: config.table,
            timestamp: new Date()
          };

          // Call the callback if provided
          if (onUpdate) {
            onUpdate(updateData);
          }

          // Show toast notification for certain events
          if (config.table === 'leads' && payload.eventType === 'INSERT') {
            toast({
              title: 'Novo Lead',
              description: `Lead "${payload.new.nome}" foi adicionado`,
              duration: 3000
            });
          }

          if (config.table === 'lead_pipeline_entries' && payload.eventType === 'UPDATE') {
            if (payload.old.etapa_atual_id !== payload.new.etapa_atual_id) {
              toast({
                title: 'Pipeline Atualizado',
                description: 'Um lead foi movido no pipeline',
                duration: 3000
              });
            }
          }
        }
      );
    });

    // Subscribe to the channel
    channel
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          console.log('✅ Realtime connection established');
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          console.error('❌ Realtime connection failed');
          toast({
            title: 'Erro de Conexão',
            description: 'Não foi possível estabelecer conexão em tempo real',
            variant: 'destructive'
          });
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false);
          console.warn('⏰ Realtime connection timed out');
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          console.log('🔌 Realtime connection closed');
        }
      });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
    };
  }, [configs, onUpdate, enabled, user, toast]);

  const disconnect = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  };

  const reconnect = () => {
    disconnect();
    // Trigger useEffect to reconnect
    setTimeout(() => {
      // Force re-render to trigger useEffect
    }, 100);
  };

  return {
    isConnected,
    disconnect,
    reconnect
  };
}

// Predefined configurations for common use cases
export const commonRealtimeConfigs = {
  leads: [
    { table: 'leads', event: '*' as const },
    { table: 'lead_pipeline_entries', event: '*' as const }
  ],
  
  pipeline: [
    { table: 'pipeline_stages', event: '*' as const },
    { table: 'lead_pipeline_entries', event: '*' as const },
    { table: 'pipeline_events', event: 'INSERT' as const }
  ],

  appointments: [
    { table: 'appointments', event: '*' as const },
    { table: 'appointment_events', event: 'INSERT' as const }
  ],

  deals: [
    { table: 'deals', event: '*' as const },
    { table: 'orders', event: '*' as const }
  ],

  all: [
    { table: 'leads', event: '*' as const },
    { table: 'lead_pipeline_entries', event: '*' as const },
    { table: 'appointments', event: '*' as const },
    { table: 'deals', event: '*' as const },
    { table: 'pipeline_events', event: 'INSERT' as const }
  ]
};