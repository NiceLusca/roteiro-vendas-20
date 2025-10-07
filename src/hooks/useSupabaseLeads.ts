import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';
import { Lead } from '@/types/crm';

export function useSupabaseLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchLeads = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar leads:', error);
        toast({
          title: "Erro ao carregar leads",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setLeads(data || []);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveLead = async (leadData: Partial<Lead> & { id?: string }) => {
    if (!user) return null;

    try {
      const { id, ...dataToSave } = leadData;
      
      if (id) {
        const { data, error } = await supabase
          .from('leads')
          .update(dataToSave)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Erro ao atualizar lead:', error);
          toast({
            title: "Erro ao atualizar lead",
            description: error.message,
            variant: "destructive"
          });
          return null;
        }

        toast({
          title: "Lead atualizado",
          description: `${data.nome} foi atualizado com sucesso`
        });

        fetchLeads();
        return data;
      } else {
        const { data, error } = await supabase
          .from('leads')
          .insert(dataToSave)
          .select()
          .single();

        if (error) {
          console.error('Erro ao criar lead:', error);
          toast({
            title: "Erro ao criar lead",
            description: error.message,
            variant: "destructive"
          });
          return null;
        }

        toast({
          title: "Lead criado",
          description: `${data.nome} foi criado com sucesso`
        });

        fetchLeads();
        return data;
      }
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      return null;
    }
  };

  const deleteLead = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar lead:', error);
        toast({
          title: "Erro ao deletar lead",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Lead deletado",
        description: "Lead foi removido com sucesso"
      });

      fetchLeads();
    } catch (error) {
      console.error('Erro ao deletar lead:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user]);

  return {
    leads,
    loading,
    saveLead,
    deleteLead,
    refetch: fetchLeads
  };
}
