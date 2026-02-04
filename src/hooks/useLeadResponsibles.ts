import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLeadActivityLog } from './useLeadActivityLog';

export interface LeadResponsible {
  id: string;
  lead_id: string;
  pipeline_entry_id?: string | null;
  user_id: string;
  assigned_at: string;
  assigned_by: string | null;
  is_primary: boolean;
  created_at: string;
  profile?: {
    user_id: string;
    nome: string | null;
    email: string | null;
    full_name: string | null;
  };
}

export interface ResponsibilityHistoryEntry {
  id: string;
  lead_id: string;
  action: 'assigned' | 'removed' | 'primary_changed';
  user_id: string;
  user_name: string;
  performed_by: string | null;
  performed_by_name: string | null;
  notes: string | null;
  created_at: string;
}

export interface UserProfile {
  user_id: string;
  nome: string | null;
  email: string | null;
  full_name: string | null;
}

export const useLeadResponsibles = (leadId?: string, pipelineEntryId?: string) => {
  const queryClient = useQueryClient();
  const { logActivity } = useLeadActivityLog();

  // Buscar responsáveis de um lead específico (por pipeline_entry_id se fornecido)
  const { data: responsibles = [], isLoading: loadingResponsibles } = useQuery({
    queryKey: ['lead-responsibles', leadId, pipelineEntryId],
    queryFn: async () => {
      if (!leadId) return [];
      
      let query = supabase
        .from('lead_responsibles')
        .select(`
          *,
          profile:profiles!lead_responsibles_user_id_fkey(user_id, nome, email, full_name)
        `);
      
      // Se pipelineEntryId fornecido, buscar por entry específico OU legados deste lead
      if (pipelineEntryId) {
        query = query.or(`pipeline_entry_id.eq.${pipelineEntryId},and(lead_id.eq.${leadId},pipeline_entry_id.is.null)`);
      } else {
        // Comportamento legado: buscar por lead_id onde pipeline_entry_id é NULL
        query = query.eq('lead_id', leadId).is('pipeline_entry_id', null);
      }
      
      const { data, error } = await query.order('is_primary', { ascending: false });

      if (error) throw error;
      return data as LeadResponsible[];
    },
    enabled: !!leadId,
  });

  // Buscar todos os usuários disponíveis
  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, nome, email, full_name')
        .order('nome');

      if (error) throw error;
      return data as UserProfile[];
    },
  });

  // Buscar histórico de responsabilidade
  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['responsibility-history', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      
      const { data, error } = await supabase
        .from('lead_responsibility_history')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ResponsibilityHistoryEntry[];
    },
    enabled: !!leadId,
  });

  // Atribuir responsável
  const assignResponsible = useMutation({
    mutationFn: async ({ 
      leadId, 
      userId, 
      isPrimary = false,
      performedByName,
      pipelineEntryId: entryId
    }: { 
      leadId: string; 
      userId: string; 
      isPrimary?: boolean;
      performedByName?: string;
      pipelineEntryId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Se for primary, remover flag de outros (no mesmo pipeline_entry)
      if (isPrimary) {
        let updateQuery = supabase
          .from('lead_responsibles')
          .update({ is_primary: false });
        
        if (entryId) {
          updateQuery = updateQuery.eq('pipeline_entry_id', entryId);
        } else {
          updateQuery = updateQuery.eq('lead_id', leadId).is('pipeline_entry_id', null);
        }
        
        await updateQuery;
      }

      // Inserir novo responsável (com pipeline_entry_id se fornecido)
      const { error: insertError } = await supabase
        .from('lead_responsibles')
        .insert({
          lead_id: leadId,
          pipeline_entry_id: entryId || null,
          user_id: userId,
          assigned_by: user?.id,
          is_primary: isPrimary,
        });

      if (insertError) throw insertError;

      // Buscar nome do usuário para histórico
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, full_name')
        .eq('user_id', userId)
        .single();

      const userName = profile?.nome || profile?.full_name || 'Usuário';

      // Registrar no histórico
      await supabase
        .from('lead_responsibility_history')
        .insert({
          lead_id: leadId,
          action: 'assigned',
          user_id: userId,
          user_name: userName,
          performed_by: user?.id,
          performed_by_name: performedByName || 'Sistema',
        });

      // Registrar atividade no log
      await logActivity({
        leadId,
        activityType: 'responsible_added',
        details: {
          responsible_name: userName,
          responsible_id: userId,
          is_primary: isPrimary
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-responsibles', leadId, pipelineEntryId] });
      queryClient.invalidateQueries({ queryKey: ['responsibility-history', leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead-responsibles-multiple'] });
      toast.success('Responsável atribuído');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('Este usuário já é responsável por este lead');
      } else {
        toast.error('Erro ao atribuir responsável');
      }
    },
  });

  // Remover responsável
  const removeResponsible = useMutation({
    mutationFn: async ({ 
      leadId, 
      userId,
      userName,
      performedByName 
    }: { 
      leadId: string; 
      userId: string;
      userName: string;
      performedByName?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('lead_responsibles')
        .delete()
        .eq('lead_id', leadId)
        .eq('user_id', userId);

      if (error) throw error;

      // Registrar no histórico
      await supabase
        .from('lead_responsibility_history')
        .insert({
          lead_id: leadId,
          action: 'removed',
          user_id: userId,
          user_name: userName,
          performed_by: user?.id,
          performed_by_name: performedByName || 'Sistema',
        });

      // Registrar atividade no log
      await logActivity({
        leadId,
        activityType: 'responsible_removed',
        details: {
          responsible_name: userName,
          responsible_id: userId
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-responsibles', leadId, pipelineEntryId] });
      queryClient.invalidateQueries({ queryKey: ['responsibility-history', leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead-responsibles-multiple'] });
      toast.success('Responsável removido');
    },
    onError: () => {
      toast.error('Erro ao remover responsável');
    },
  });

  // Definir responsável principal
  const setPrimaryResponsible = useMutation({
    mutationFn: async ({ 
      leadId, 
      userId,
      userName,
      performedByName 
    }: { 
      leadId: string; 
      userId: string;
      userName: string;
      performedByName?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Remover primary de todos
      await supabase
        .from('lead_responsibles')
        .update({ is_primary: false })
        .eq('lead_id', leadId);

      // Definir novo primary
      const { error } = await supabase
        .from('lead_responsibles')
        .update({ is_primary: true })
        .eq('lead_id', leadId)
        .eq('user_id', userId);

      if (error) throw error;

      // Registrar no histórico
      await supabase
        .from('lead_responsibility_history')
        .insert({
          lead_id: leadId,
          action: 'primary_changed',
          user_id: userId,
          user_name: userName,
          performed_by: user?.id,
          performed_by_name: performedByName || 'Sistema',
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-responsibles', leadId, pipelineEntryId] });
      queryClient.invalidateQueries({ queryKey: ['responsibility-history', leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead-responsibles-multiple'] });
      toast.success('Responsável principal definido');
    },
    onError: () => {
      toast.error('Erro ao definir responsável principal');
    },
  });

  return {
    responsibles,
    allUsers,
    history,
    loadingResponsibles,
    loadingUsers,
    loadingHistory,
    assignResponsible,
    removeResponsible,
    setPrimaryResponsible,
  };
};

// Hook para buscar responsáveis de múltiplos leads (para Kanban)
// Aceita um mapa de leadId -> pipelineEntryId para buscar por pipeline específico
export const useMultipleLeadResponsibles = (
  entryMap: Record<string, string> // { leadId: pipelineEntryId }
) => {
  const entryIds = Object.values(entryMap);
  const leadIds = Object.keys(entryMap);
  
  return useQuery({
    queryKey: ['lead-responsibles-multiple', entryIds],
    queryFn: async () => {
      if (!entryIds.length) return {};
      
      // Buscar por pipeline_entry_id OU por lead_id com entry NULL (legados)
      const { data, error } = await supabase
        .from('lead_responsibles')
        .select(`
          *,
          profile:profiles!lead_responsibles_user_id_fkey(user_id, nome, email, full_name)
        `)
        .or(`pipeline_entry_id.in.(${entryIds.join(',')}),and(lead_id.in.(${leadIds.join(',')}),pipeline_entry_id.is.null)`)
        .order('is_primary', { ascending: false });

      if (error) throw error;

      // Criar mapa invertido: pipelineEntryId -> leadId
      const entryToLead: Record<string, string> = {};
      Object.entries(entryMap).forEach(([leadId, entryId]) => {
        entryToLead[entryId] = leadId;
      });

      // Agrupar por lead_id (usando o mapa invertido)
      const grouped: Record<string, LeadResponsible[]> = {};
      data?.forEach((item) => {
        const leadId = item.pipeline_entry_id ? entryToLead[item.pipeline_entry_id] : item.lead_id;
        if (leadId) {
          if (!grouped[leadId]) {
            grouped[leadId] = [];
          }
          grouped[leadId].push(item as LeadResponsible);
        }
      });

      return grouped;
    },
    enabled: entryIds.length > 0,
    staleTime: 30000, // Cache por 30 segundos
  });
};
