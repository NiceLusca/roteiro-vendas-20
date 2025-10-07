import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';
import { StageChecklistItem } from '@/types/crm';

export function useSupabaseChecklistItems(etapaId?: string) {
  const [checklistItems, setChecklistItems] = useState<StageChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchItems = async () => {
    if (!user || !etapaId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stage_checklist_items')
        .select('*')
        .eq('etapa_id', etapaId)
        .eq('ativo', true)
        .order('ordem');

      if (error) {
        console.error('Erro ao buscar itens do checklist:', error);
        toast({
          title: "Erro ao carregar checklist",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setChecklistItems(data || []);
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveItem = async (itemData: Partial<StageChecklistItem> & { id?: string }) => {
    if (!user) return null;

    try {
      const { id, created_at, updated_at, ...dataToSave } = itemData;
      
      if (id) {
        const { data, error } = await supabase
          .from('stage_checklist_items')
          .update(dataToSave as any)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          toast({
            title: "Erro ao atualizar item",
            description: error.message,
            variant: "destructive"
          });
          return null;
        }

        toast({
          title: "Item atualizado",
          description: "Item do checklist foi atualizado"
        });

        fetchItems();
        return data;
      } else {
        const { data, error} = await supabase
          .from('stage_checklist_items')
          .insert(dataToSave as any)
          .select()
          .single();

        if (error) {
          toast({
            title: "Erro ao criar item",
            description: error.message,
            variant: "destructive"
          });
          return null;
        }

        toast({
          title: "Item criado",
          description: "Item foi adicionado ao checklist"
        });

        fetchItems();
        return data;
      }
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      return null;
    }
  };

  const deleteItem = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('stage_checklist_items')
        .update({ ativo: false })
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro ao remover item",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Item removido",
        description: "Item foi removido do checklist"
      });

      fetchItems();
    } catch (error) {
      console.error('Erro ao deletar item:', error);
    }
  };

  useEffect(() => {
    if (user && etapaId) {
      fetchItems();
    }
  }, [user, etapaId]);

  return {
    checklistItems,
    loading,
    saveItem,
    deleteItem,
    refetch: fetchItems
  };
}
