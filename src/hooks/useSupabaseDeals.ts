import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';

interface Deal {
  id: string;
  lead_id: string;
  product_id?: string;
  valor_proposto: number;
  status: 'Aberta' | 'Ganha' | 'Perdida' | 'Pausada';
  closer?: string;
  fase_negociacao?: string;
  created_at: string;
  updated_at: string;
}

export function useSupabaseDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchDeals = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar deals:', error);
        toast({
          title: "Erro ao carregar deals",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setDeals(data?.map(deal => ({
        ...deal,
        created_at: new Date(deal.created_at).toISOString(),
        updated_at: new Date(deal.updated_at).toISOString()
      })) || []);
    } catch (error) {
      console.error('Erro ao buscar deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveDeal = async (dealData: Partial<Deal> & { id?: string }) => {
    if (!user) return null;

    try {
      const isUpdate = !!dealData.id;
      
      const payload: any = {};
      
      Object.keys(dealData).forEach(key => {
        if (key !== 'id' && dealData[key as keyof typeof dealData] !== undefined) {
          payload[key] = dealData[key as keyof typeof dealData];
        }
      });
      
      payload.updated_at = new Date().toISOString();
      
      if (!isUpdate) {
        payload.created_at = new Date().toISOString();
      }

      let result;
      if (isUpdate) {
        const { data, error } = await supabase
          .from('deals')
          .update(payload)
          .eq('id', dealData.id!)
          .select()
          .single();
        
        result = { data, error };
      } else {
        const { data, error } = await supabase
          .from('deals')
          .insert(payload)
          .select()
          .single();
        
        result = { data, error };
      }

      if (result.error) {
        console.error('Erro ao salvar deal:', result.error);
        toast({
          title: `Erro ao ${isUpdate ? 'atualizar' : 'criar'} deal`,
          description: result.error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: `Deal ${isUpdate ? 'atualizado' : 'criado'} com sucesso`,
        description: `Deal foi ${isUpdate ? 'atualizado' : 'criado'}`
      });

      fetchDeals();
      
      return result.data;
    } catch (error) {
      console.error('Erro ao salvar deal:', error);
      return null;
    }
  };

  const getDealById = (id: string): Deal | undefined => {
    return deals.find(deal => deal.id === id);
  };

  const getDealsByStatus = (status: Deal['status']): Deal[] => {
    return deals.filter(deal => deal.status === status);
  };

  const getDealsByLeadId = (leadId: string): Deal[] => {
    return deals.filter(deal => deal.lead_id === leadId);
  };

  useEffect(() => {
    if (user) {
      fetchDeals();
    }
  }, [user]);

  return {
    deals,
    loading,
    saveDeal,
    getDealById,
    getDealsByStatus,
    getDealsByLeadId,
    refetch: fetchDeals
  };
}