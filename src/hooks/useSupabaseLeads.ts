import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';

// Force cache refresh
export function useSupabaseLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch leads - Optimized query
  const fetchLeads = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Only select necessary fields for better performance
      const { data, error } = await supabase
        .from('leads')
        .select(`
          id,
          nome,
          email,
          whatsapp,
          origem,
          segmento,
          status_geral,
          lead_score,
          lead_score_classification,
          closer,
          desejo_na_sessao,
          objecao_principal,
          ja_vendeu_no_digital,
          seguidores,
          faturamento_medio,
          meta_faturamento,
          resultado_sessao_ultimo,
          objecao_obs,
          observacoes,
          resultado_obs_ultima_sessao,
          valor_lead,
          user_id,
          created_at,
          updated_at
        `)
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

      setLeads(data?.map(lead => ({
        ...lead,
        created_at: new Date(lead.created_at),
        updated_at: new Date(lead.updated_at)
      })) || []);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save lead
  const saveLead = async (leadData: Partial<Lead> & { id?: string }) => {
    if (!user) return null;

    try {
      const isUpdate = !!leadData.id;
      
      // Prepare payload with proper field mapping
      const payload: any = {};
      
      // Map all fields from leadData to database format
      Object.keys(leadData).forEach(key => {
        if (key !== 'id' && leadData[key as keyof typeof leadData] !== undefined) {
          payload[key] = leadData[key as keyof typeof leadData];
        }
      });
      
      // Add required fields
      payload.user_id = user.id;
      payload.updated_at = new Date().toISOString();
      
      if (!isUpdate) {
        payload.created_at = new Date().toISOString();
      }

      let result;
      if (isUpdate) {
        const { data, error } = await supabase
          .from('leads')
          .update(payload)
          .eq('id', leadData.id!)
          .select()
          .maybeSingle();
        
        result = { data, error };
      } else {
        const { data, error } = await supabase
          .from('leads')
          .insert(payload)
          .select()
          .maybeSingle();
        
        result = { data, error };
      }

      if (result.error) {
        console.error('Erro ao salvar lead:', result.error);
        toast({
          title: `Erro ao ${isUpdate ? 'atualizar' : 'criar'} lead`,
          description: result.error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: `Lead ${isUpdate ? 'atualizado' : 'criado'} com sucesso`,
        description: `Lead ${result.data.nome} foi ${isUpdate ? 'atualizado' : 'criado'}`
      });

      // Refresh leads
      fetchLeads();
      
      return result.data;
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      return null;
    }
  };

  // Get lead by ID
  const getLeadById = (id: string): Lead | undefined => {
    return leads.find(lead => lead.id === id);
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
    getLeadById,
    refetch: fetchLeads
  };
}