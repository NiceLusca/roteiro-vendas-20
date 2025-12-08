import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextSecure';
import { logger } from '@/utils/logger';

export type ActivityType = 
  | 'stage_change'
  | 'note_added'
  | 'attachment_added'
  | 'attachment_deleted'
  | 'responsible_added'
  | 'responsible_removed'
  | 'inscription'
  | 'archive'
  | 'transfer'
  | 'lead_created'
  | 'lead_updated';

export interface LeadActivity {
  id: string;
  lead_id: string;
  pipeline_entry_id: string | null;
  activity_type: ActivityType;
  details: Record<string, any>;
  performed_by: string | null;
  performed_by_name: string | null;
  created_at: string;
}

interface LogActivityParams {
  leadId: string;
  pipelineEntryId?: string;
  activityType: ActivityType;
  details: Record<string, any>;
}

export function useLeadActivityLog(leadId?: string) {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Buscar atividades de um lead
  const fetchActivities = useCallback(async (id: string) => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_activity_log')
        .select('*')
        .eq('lead_id', id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        logger.error('Erro ao buscar atividades', error, { feature: 'activity-log' });
        return;
      }

      // Cast to correct type
      const typedData = (data || []).map(item => ({
        ...item,
        activity_type: item.activity_type as ActivityType,
        details: (item.details || {}) as Record<string, any>
      }));

      setActivities(typedData);
    } catch (err) {
      logger.error('Erro ao buscar atividades', err as Error, { feature: 'activity-log' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Registrar nova atividade
  const logActivity = useCallback(async ({
    leadId,
    pipelineEntryId,
    activityType,
    details
  }: LogActivityParams) => {
    if (!user) {
      logger.warn('Usuário não autenticado para log de atividade', { feature: 'activity-log' });
      return;
    }

    try {
      // Buscar nome do usuário do perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome, full_name')
        .eq('user_id', user.id)
        .maybeSingle();

      const performerName = profileData?.nome || profileData?.full_name || user.email || 'Usuário';

      const activityData = {
        lead_id: leadId,
        pipeline_entry_id: pipelineEntryId || null,
        activity_type: activityType,
        details,
        performed_by: user.id,
        performed_by_name: performerName
      };

      const { error } = await supabase
        .from('lead_activity_log')
        .insert(activityData);

      if (error) {
        logger.error('Erro ao registrar atividade', error, { 
          feature: 'activity-log',
          metadata: { activityType, leadId }
        });
        return;
      }

      logger.debug('Atividade registrada', {
        feature: 'activity-log',
        metadata: { activityType, leadId }
      });

    } catch (err) {
      logger.error('Erro ao registrar atividade', err as Error, { feature: 'activity-log' });
    }
  }, [user]);

  // Auto-fetch quando leadId muda
  useEffect(() => {
    if (leadId) {
      fetchActivities(leadId);
    }
  }, [leadId, fetchActivities]);

  // Realtime subscription
  useEffect(() => {
    if (!leadId) return;

    const channel = supabase
      .channel(`activity-log-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lead_activity_log',
          filter: `lead_id=eq.${leadId}`
        },
        (payload) => {
          const newActivity = payload.new as LeadActivity;
          setActivities(prev => [newActivity, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  return {
    activities,
    loading,
    logActivity,
    refetch: () => leadId && fetchActivities(leadId)
  };
}
