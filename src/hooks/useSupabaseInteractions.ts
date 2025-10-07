import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';

interface Interaction {
  id: string;
  lead_id: string;
  canal: 'whatsapp' | 'telefone' | 'email' | 'presencial' | 'outro';
  descricao: string;
  data_hora: string;
  created_at: string;
  timestamp?: string;
}

export function useSupabaseInteractions() {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchInteractions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .order('data_hora', { ascending: false });

      if (error) {
        console.error('Erro ao buscar interações:', error);
        toast({
          title: "Erro ao carregar interações",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setInteractions(data || []);
    } catch (error) {
      console.error('Erro ao buscar interações:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveInteraction = async (interactionData: Partial<Interaction>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('interactions')
        .insert({
          lead_id: interactionData.lead_id,
          canal: interactionData.canal,
          descricao: interactionData.descricao,
          data_hora: interactionData.data_hora || new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar interação:', error);
        toast({
          title: "Erro ao criar interação",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Interação criada com sucesso",
        description: `Interação via ${interactionData.canal} foi registrada`
      });

      fetchInteractions();
      
      return data;
    } catch (error) {
      console.error('Erro ao salvar interação:', error);
      return null;
    }
  };

  const getInteractionById = (id: string): Interaction | undefined => {
    return interactions.find(interaction => interaction.id === id);
  };

  const getInteractionsByLeadId = (leadId: string): Interaction[] => {
    return interactions.filter(interaction => interaction.lead_id === leadId);
  };

  const getInteractionsByChannel = (canal: Interaction['canal']): Interaction[] => {
    return interactions.filter(interaction => interaction.canal === canal);
  };

  const getRecentInteractions = (hours: number = 24): Interaction[] => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return interactions.filter(interaction => 
      new Date(interaction.data_hora) >= cutoff
    );
  };

  useEffect(() => {
    if (user) {
      fetchInteractions();
    }
  }, [user]);

  return {
    interactions,
    loading,
    saveInteraction,
    getInteractionById,
    getInteractionsByLeadId,
    getInteractionsByChannel,
    getRecentInteractions,
    refetch: fetchInteractions
  };
}