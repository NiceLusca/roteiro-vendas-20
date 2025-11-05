import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';
import { StageChecklistItem } from '@/types/crm';

export function useSupabaseChecklistItems(stageId?: string) {
  const [checklistItems, setChecklistItems] = useState<StageChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch checklist items for a specific stage
  const fetchChecklistItems = async (targetStageId?: string) => {
    if (!user) return;
    
    const queryStageId = targetStageId || stageId;
    if (!queryStageId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stage_checklist_items')
        .select(`
          id,
          etapa_id,
          titulo,
          descricao,
          obrigatorio,
          ordem,
          ativo,
          created_at,
          updated_at
        `)
        .eq('etapa_id', queryStageId)
        .order('ordem', { ascending: true });

      if (error) {
        console.error('Erro ao buscar checklist:', error);
        toast({
          title: "Erro ao carregar checklist",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setChecklistItems(data || []);
    } catch (error) {
      console.error('Erro ao buscar checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save checklist item (create or update)
  const saveChecklistItem = async (itemData: Partial<StageChecklistItem> & { id?: string }) => {
    if (!user) return null;

    try {
      const isUpdate = !!itemData.id;
      
      const payload: any = {};
      
      Object.keys(itemData).forEach(key => {
        if (key !== 'id' && itemData[key as keyof typeof itemData] !== undefined) {
          payload[key] = itemData[key as keyof typeof itemData];
        }
      });
      
      if (!isUpdate) {
        payload.created_at = new Date().toISOString();
      }

      let result;
      if (isUpdate) {
        const { data, error } = await supabase
          .from('stage_checklist_items')
          .update(payload)
          .eq('id', itemData.id!)
          .select()
          .single();
        
        result = { data, error };
      } else {
        const { data, error } = await supabase
          .from('stage_checklist_items')
          .insert(payload)
          .select()
          .single();
        
        result = { data, error };
      }

      if (result.error) {
        console.error('Erro ao salvar item do checklist:', result.error);
        toast({
          title: `Erro ao ${isUpdate ? 'atualizar' : 'criar'} item`,
          description: result.error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: `Item ${isUpdate ? 'atualizado' : 'criado'} com sucesso`,
        description: `Item "${result.data.titulo}" foi ${isUpdate ? 'atualizado' : 'criado'}`
      });

      fetchChecklistItems();
      
      return result.data;
    } catch (error) {
      console.error('Erro ao salvar item do checklist:', error);
      return null;
    }
  };

  // Delete checklist item
  const deleteChecklistItem = async (itemId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('stage_checklist_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Erro ao excluir item do checklist:', error);
        toast({
          title: "Erro ao excluir item",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Item excluído com sucesso",
        description: "O item foi removido do checklist"
      });

      fetchChecklistItems();
      return true;
    } catch (error) {
      console.error('Erro ao excluir item do checklist:', error);
      return false;
    }
  };

  // Get checklist item by ID
  const getChecklistItemById = (id: string): StageChecklistItem | undefined => {
    return checklistItems.find(item => item.id === id);
  };

  // Get checklist items by stage ID
  const getChecklistItemsByStage = (targetStageId: string): StageChecklistItem[] => {
    return checklistItems.filter(item => item.etapa_id === targetStageId);
  };

  // Reorder checklist items
  const reorderChecklistItems = async (reorderedItems: StageChecklistItem[]) => {
    if (!user) return false;

    try {
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        ordem: index + 1
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('stage_checklist_items')
          .update({ ordem: update.ordem })
          .eq('id', update.id);

        if (error) {
          throw error;
        }
      }

      toast({
        title: "Ordem atualizada com sucesso",
        description: "A ordem dos itens do checklist foi alterada"
      });

      fetchChecklistItems();
      return true;
    } catch (error) {
      console.error('Erro ao reordenar checklist:', error);
      toast({
        title: "Erro ao reordenar itens",
        description: "Não foi possível alterar a ordem dos itens",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    if (user && stageId) {
      fetchChecklistItems();
    }
  }, [user, stageId]);

  return {
    checklistItems,
    loading,
    saveChecklistItem,
    deleteChecklistItem,
    getChecklistItemById,
    getChecklistItemsByStage,
    reorderChecklistItems,
    refetch: fetchChecklistItems
  };
}