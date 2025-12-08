import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLeadActivityLog } from './useLeadActivityLog';

export interface LeadResponsible {
  id: string;
  lead_id: string;
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

export const useLeadResponsibles = (leadId?: string) => {
  const queryClient = useQueryClient();
  const { logActivity } = useLeadActivityLog();

  // Buscar responsáveis de um lead específico
  const { data: responsibles = [], isLoading: loadingResponsibles } = useQuery({
    queryKey: ['lead-responsibles', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      
      const { data, error } = await supabase
        .from('lead_responsibles')
        .select(`
          *,
          profile:profiles!lead_responsibles_user_id_fkey(user_id, nome, email, full_name)
        `)
        .eq('lead_id', leadId)
        .order('is_primary', { ascending: false });

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
      performedByName 
    }: { 
      leadId: string; 
      userId: string; 
      isPrimary?: boolean;
      performedByName?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Se for primary, remover flag de outros
      if (isPrimary) {
        await supabase
          .from('lead_responsibles')
          .update({ is_primary: false })
          .eq('lead_id', leadId);
      }

      // Inserir novo responsável
      const { error: insertError } = await supabase
        .from('lead_responsibles')
        .insert({
          lead_id: leadId,
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
      queryClient.invalidateQueries({ queryKey: ['lead-responsibles', leadId] });
      queryClient.invalidateQueries({ queryKey: ['responsibility-history', leadId] });
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
      queryClient.invalidateQueries({ queryKey: ['lead-responsibles', leadId] });
      queryClient.invalidateQueries({ queryKey: ['responsibility-history', leadId] });
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
      queryClient.invalidateQueries({ queryKey: ['lead-responsibles', leadId] });
      queryClient.invalidateQueries({ queryKey: ['responsibility-history', leadId] });
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
export const useMultipleLeadResponsibles = (leadIds: string[]) => {
  return useQuery({
    queryKey: ['lead-responsibles-multiple', leadIds],
    queryFn: async () => {
      if (!leadIds.length) return {};
      
      const { data, error } = await supabase
        .from('lead_responsibles')
        .select(`
          *,
          profile:profiles!lead_responsibles_user_id_fkey(user_id, nome, email, full_name)
        `)
        .in('lead_id', leadIds)
        .order('is_primary', { ascending: false });

      if (error) throw error;

      // Agrupar por lead_id
      const grouped: Record<string, LeadResponsible[]> = {};
      data?.forEach((item) => {
        if (!grouped[item.lead_id]) {
          grouped[item.lead_id] = [];
        }
        grouped[item.lead_id].push(item as LeadResponsible);
      });

      return grouped;
    },
    enabled: leadIds.length > 0,
    staleTime: 30000, // Cache por 30 segundos
  });
};
