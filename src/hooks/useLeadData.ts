import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextSecure';
import { Lead } from '@/types/crm';

export function useLeadData(leadId?: string) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchLead = async () => {
    if (!user || !leadId) {
      setLead(null);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (error) {
        console.error('Erro ao buscar lead:', error);
        setLead(null);
        return;
      }

      setLead(data);
    } catch (error) {
      console.error('Erro ao buscar lead:', error);
      setLead(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
  }, [user, leadId]);

  return {
    lead,
    loading,
    refetch: fetchLead
  };
}
