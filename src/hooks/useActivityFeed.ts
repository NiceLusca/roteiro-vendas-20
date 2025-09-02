import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ActivityItem {
  id: string;
  type: 'lead_created' | 'lead_updated' | 'stage_advanced' | 'appointment_scheduled' | 'deal_created' | 'note_added' | 'pipeline_transfer';
  actor: string;
  target_type: 'lead' | 'appointment' | 'deal' | 'pipeline';
  target_id: string;
  target_name: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  read: boolean;
}

interface UseActivityFeedOptions {
  limit?: number;
  types?: ActivityItem['type'][];
  targetId?: string;
  realtime?: boolean;
}

export function useActivityFeed(options: UseActivityFeedOptions = {}) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    limit = 50,
    types,
    targetId,
    realtime = true
  } = options;

  // Fetch activities from multiple sources and create unified feed
  const fetchActivities = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const activitiesData: ActivityItem[] = [];

    try {
      // Fetch pipeline events
      const { data: pipelineEvents } = await supabase
        .from('pipeline_events')
        .select(`
          *,
          lead_pipeline_entries!inner(
            leads!inner(nome, user_id)
          )
        `)
        .eq('lead_pipeline_entries.leads.user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (pipelineEvents) {
        pipelineEvents.forEach(event => {
          if (event.lead_pipeline_entries?.leads) {
            const lead = event.lead_pipeline_entries.leads as any;
            activitiesData.push({
              id: `pipeline-${event.id}`,
              type: 'stage_advanced',
              actor: event.ator,
              target_type: 'lead',
              target_id: lead.id || 'unknown',
              target_name: lead.nome || 'Lead',
              description: `Lead ${event.tipo.toLowerCase()} no pipeline`,
              metadata: (event.detalhes as any) || {},
              timestamp: new Date(event.timestamp),
              read: false
            });
          }
        });
      }

      // Fetch appointment events
      const { data: appointmentEvents } = await supabase
        .from('appointment_events')
        .select(`
          *,
          appointments!inner(
            leads!inner(nome, user_id)
          )
        `)
        .eq('appointments.leads.user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (appointmentEvents) {
        appointmentEvents.forEach(event => {
          if (event.appointments?.leads) {
            const lead = event.appointments.leads as any;
            activitiesData.push({
              id: `appointment-${event.id}`,
              type: 'appointment_scheduled',
              actor: event.ator,
              target_type: 'lead',
              target_id: lead.id || 'unknown',
              target_name: lead.nome || 'Lead',
              description: `Agendamento ${event.tipo.toLowerCase()}`,
              metadata: { antes: event.antes || {}, depois: event.depois || {} },
              timestamp: new Date(event.timestamp),
              read: false
            });
          }
        });
      }

      // Fetch audit logs for additional context
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (auditLogs) {
        auditLogs.forEach(log => {
          let targetName = 'Item';
          let activityType: ActivityItem['type'] = 'lead_updated';

          if (log.entidade === 'Lead') {
            activityType = 'lead_updated';
          } else if (log.entidade === 'Deal') {
            activityType = 'deal_created';
          }

          activitiesData.push({
            id: `audit-${log.id}`,
            type: activityType,
            actor: log.ator,
            target_type: log.entidade.toLowerCase() as ActivityItem['target_type'],
            target_id: log.entidade_id,
            target_name: targetName,
            description: `${log.entidade} foi ${Array.isArray(log.alteracao) && log.alteracao.length > 0 ? 'atualizado' : 'modificado'}`,
            metadata: (log.alteracao as any) || {},
            timestamp: new Date(log.timestamp),
            read: false
          });
        });
      }

      // Sort all activities by timestamp
      activitiesData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply filters
      let filteredActivities = activitiesData;

      if (types && types.length > 0) {
        filteredActivities = filteredActivities.filter(activity => 
          types.includes(activity.type)
        );
      }

      if (targetId) {
        filteredActivities = filteredActivities.filter(activity => 
          activity.target_id === targetId
        );
      }

      // Take only the requested limit
      filteredActivities = filteredActivities.slice(0, limit);

      setActivities(filteredActivities);
      setUnreadCount(filteredActivities.filter(a => !a.read).length);

    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: 'Erro ao carregar atividades',
        description: 'Não foi possível carregar o feed de atividades',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, limit, types, targetId, toast]);

  // Mark activities as read
  const markAsRead = useCallback((activityIds: string[]) => {
    setActivities(prev => 
      prev.map(activity => 
        activityIds.includes(activity.id) 
          ? { ...activity, read: true }
          : activity
      )
    );
    
    setUnreadCount(prev => Math.max(0, prev - activityIds.length));
  }, []);

  const markAllAsRead = useCallback(() => {
    const unreadIds = activities.filter(a => !a.read).map(a => a.id);
    markAsRead(unreadIds);
  }, [activities, markAsRead]);

  // Add new activity (for real-time updates)
  const addActivity = useCallback((activity: Omit<ActivityItem, 'id' | 'read'>) => {
    const newActivity: ActivityItem = {
      ...activity,
      id: `realtime-${Date.now()}-${Math.random()}`,
      read: false
    };

    setActivities(prev => [newActivity, ...prev.slice(0, limit - 1)]);
    setUnreadCount(prev => prev + 1);

    // Show toast notification
    toast({
      title: 'Nova Atividade',
      description: activity.description,
      duration: 3000
    });
  }, [limit, toast]);

  // Get activity icon based on type
  const getActivityIcon = useCallback((type: ActivityItem['type']) => {
    switch (type) {
      case 'lead_created': return '👤';
      case 'lead_updated': return '✏️';
      case 'stage_advanced': return '🔄';
      case 'appointment_scheduled': return '📅';
      case 'deal_created': return '💰';
      case 'note_added': return '📝';
      case 'pipeline_transfer': return '↗️';
      default: return '📋';
    }
  }, []);

  // Get activity color based on type
  const getActivityColor = useCallback((type: ActivityItem['type']) => {
    switch (type) {
      case 'lead_created': return 'text-success';
      case 'lead_updated': return 'text-primary';
      case 'stage_advanced': return 'text-warning';
      case 'appointment_scheduled': return 'text-info';
      case 'deal_created': return 'text-success';
      case 'note_added': return 'text-muted-foreground';
      case 'pipeline_transfer': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  }, []);

  // Format relative time
  const formatRelativeTime = useCallback((date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d atrás`;
    
    return date.toLocaleDateString('pt-BR');
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!realtime || !user) return;

    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pipeline_events' },
        (payload) => {
          addActivity({
            type: 'stage_advanced',
            actor: payload.new.ator,
            target_type: 'lead',
            target_id: payload.new.lead_pipeline_entry_id,
            target_name: 'Lead',
            description: `Pipeline ${payload.new.tipo}`,
            timestamp: new Date(payload.new.timestamp)
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'appointment_events' },
        (payload) => {
          addActivity({
            type: 'appointment_scheduled',
            actor: payload.new.ator,
            target_type: 'appointment',
            target_id: payload.new.appointment_id,
            target_name: 'Agendamento',
            description: `Agendamento ${payload.new.tipo}`,
            timestamp: new Date(payload.new.timestamp)
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [realtime, user, addActivity]);

  return {
    activities,
    loading,
    unreadCount,
    fetchActivities,
    markAsRead,
    markAllAsRead,
    addActivity,
    getActivityIcon,
    getActivityColor,
    formatRelativeTime,
    refetch: fetchActivities
  };
}