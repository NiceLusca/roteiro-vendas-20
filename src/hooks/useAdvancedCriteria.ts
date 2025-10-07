import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StageAdvancementCriteria, LeadCriteriaState } from '@/types/advancedCriteria';
import { useToast } from '@/hooks/use-toast';

export function useAdvancedCriteria(stageId?: string) {
  const [criteria, setCriteria] = useState<StageAdvancementCriteria[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCriteria = useCallback(async () => {
    if (!stageId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stage_advancement_criteria')
        .select('*')
        .eq('etapa_id', stageId)
        .eq('ativo', true);

      if (error) throw error;
      setCriteria((data || []) as StageAdvancementCriteria[]);
    } catch (error) {
      console.error('Error fetching criteria:', error);
      toast({
        title: "Erro ao carregar critérios",
        description: "Não foi possível carregar os critérios da etapa.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [stageId, toast]);

  const createCriteria = useCallback(async (criteriaData: Partial<StageAdvancementCriteria> & { etapa_id: string; tipo: string }) => {
    try {
      const { data, error } = await supabase
        .from('stage_advancement_criteria')
        .insert(criteriaData)
        .select()
        .single();

      if (error) throw error;
      
      setCriteria(prev => [...prev, data as StageAdvancementCriteria]);
      toast({
        title: "Critério criado",
        description: "Critério adicionado com sucesso.",
      });
      
      return data;
    } catch (error) {
      console.error('Error creating criteria:', error);
      toast({
        title: "Erro ao criar critério",
        description: "Não foi possível criar o critério.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const updateCriteria = useCallback(async (id: string, updates: Partial<StageAdvancementCriteria>) => {
    try {
      const { error } = await supabase
        .from('stage_advancement_criteria')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setCriteria(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      toast({
        title: "Critério atualizado",
        description: "Critério atualizado com sucesso.",
      });
      
      return true;
    } catch (error) {
      console.error('Error updating criteria:', error);
      toast({
        title: "Erro ao atualizar critério",
        description: "Não foi possível atualizar o critério.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const deleteCriteria = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('stage_advancement_criteria')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
      
      setCriteria(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Critério removido",
        description: "Critério removido com sucesso.",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting criteria:', error);
      toast({
        title: "Erro ao remover critério",
        description: "Não foi possível remover o critério.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  useEffect(() => {
    fetchCriteria();
  }, [fetchCriteria]);

  return {
    criteria,
    loading,
    createCriteria,
    updateCriteria,
    deleteCriteria,
    refreshCriteria: fetchCriteria
  };
}

export function useLeadCriteriaState(leadId?: string, stageId?: string) {
  const [criteriaStates, setCriteriaStates] = useState<LeadCriteriaState[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCriteriaStates = useCallback(async () => {
    if (!leadId || !stageId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_criteria_state')
        .select('*')
        .eq('lead_id', leadId);

      if (error) throw error;
      setCriteriaStates((data || []) as LeadCriteriaState[]);
    } catch (error) {
      console.error('Error fetching criteria states:', error);
    } finally {
      setLoading(false);
    }
  }, [leadId, stageId]);

  const updateCriteriaState = useCallback(async (
    criterioId: string,
    status: LeadCriteriaState['status'],
    valorValidacao?: any,
    observacoes?: string
  ) => {
    if (!leadId || !stageId) return;

    try {
      const { data, error } = await supabase
        .from('lead_criteria_state')
        .upsert({
          lead_id: leadId,
          criterio_id: criterioId,
          status,
          valor_validacao: valorValidacao ? String(valorValidacao) : null,
          validado_em: status === 'atendido' ? new Date().toISOString() : null,
          validado_por: status === 'atendido' ? 'Sistema' : null
        })
        .select()
        .single();

      if (error) throw error;
      
      setCriteriaStates(prev => {
        const existing = prev.find(cs => cs.criterio_id === criterioId);
        if (existing) {
          return prev.map(cs => cs.criterio_id === criterioId ? data as LeadCriteriaState : cs);
        } else {
          return [...prev, data as LeadCriteriaState];
        }
      });
      
      return data;
    } catch (error) {
      console.error('Error updating criteria state:', error);
      toast({
        title: "Erro ao atualizar status do critério",
        description: "Não foi possível atualizar o status do critério.",
        variant: "destructive",
      });
      return null;
    }
  }, [leadId, stageId, toast]);

  useEffect(() => {
    fetchCriteriaStates();
  }, [fetchCriteriaStates]);

  return {
    criteriaStates,
    loading,
    updateCriteriaState,
    refreshCriteriaStates: fetchCriteriaStates
  };
}