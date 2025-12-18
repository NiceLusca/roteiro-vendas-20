import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Tipo parcial de Lead para detecção de duplicatas
export interface DuplicateLead {
  id: string;
  nome: string;
  email: string | null;
  whatsapp: string | null;
  origem: string | null;
  created_at: string | null;
  lead_score: number | null;
  segmento: string | null;
  status_geral: string | null;
}

export interface DuplicatePair {
  lead1: DuplicateLead;
  lead2: DuplicateLead;
  matchType: 'whatsapp' | 'email' | 'nome_similar';
  confidence: 'alta' | 'media' | 'baixa';
}

export function useDuplicateDetection() {
  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const detectDuplicates = useCallback(async () => {
    setLoading(true);
    try {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('id, nome, email, whatsapp, origem, created_at, lead_score, segmento, status_geral')
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!leads) return;

      const pairs: DuplicatePair[] = [];
      const processedPairs = new Set<string>();

      // Agrupar por WhatsApp
      const byWhatsApp = new Map<string, DuplicateLead[]>();
      leads.forEach(lead => {
        if (lead.whatsapp) {
          const clean = lead.whatsapp.replace(/\D/g, '');
          if (clean.length >= 8) {
            const existing = byWhatsApp.get(clean) || [];
            existing.push(lead as DuplicateLead);
            byWhatsApp.set(clean, existing);
          }
        }
      });

      byWhatsApp.forEach((group) => {
        if (group.length > 1) {
          for (let i = 0; i < group.length - 1; i++) {
            const pairKey = [group[i].id, group[i + 1].id].sort().join('-');
            if (!processedPairs.has(pairKey)) {
              processedPairs.add(pairKey);
              pairs.push({
                lead1: group[i],
                lead2: group[i + 1],
                matchType: 'whatsapp',
                confidence: 'alta'
              });
            }
          }
        }
      });

      // Agrupar por Email
      const byEmail = new Map<string, DuplicateLead[]>();
      leads.forEach(lead => {
        if (lead.email) {
          const clean = lead.email.toLowerCase().trim();
          // Ignorar emails vazios ou inválidos após limpeza
          if (clean.length > 0 && clean !== 'n/a') {
            const existing = byEmail.get(clean) || [];
            existing.push(lead as DuplicateLead);
            byEmail.set(clean, existing);
          }
        }
      });

      byEmail.forEach((group) => {
        if (group.length > 1) {
          for (let i = 0; i < group.length - 1; i++) {
            const pairKey = [group[i].id, group[i + 1].id].sort().join('-');
            if (!processedPairs.has(pairKey)) {
              processedPairs.add(pairKey);
              pairs.push({
                lead1: group[i],
                lead2: group[i + 1],
                matchType: 'email',
                confidence: 'alta'
              });
            }
          }
        }
      });

      // Detectar nomes similares (usando uma comparação simples)
      for (let i = 0; i < leads.length; i++) {
        for (let j = i + 1; j < leads.length; j++) {
          const pairKey = [leads[i].id, leads[j].id].sort().join('-');
          if (processedPairs.has(pairKey)) continue;

          const name1 = leads[i].nome?.toLowerCase().trim() || '';
          const name2 = leads[j].nome?.toLowerCase().trim() || '';

          if (name1.length >= 3 && name2.length >= 3) {
            // Verificar se um nome contém o outro ou são muito parecidos
            if (name1 === name2 || 
                (name1.includes(name2) && name2.length >= 5) || 
                (name2.includes(name1) && name1.length >= 5)) {
              processedPairs.add(pairKey);
              pairs.push({
                lead1: leads[i] as DuplicateLead,
                lead2: leads[j] as DuplicateLead,
                matchType: 'nome_similar',
                confidence: name1 === name2 ? 'alta' : 'media'
              });
            }
          }
        }
      }

      setDuplicates(pairs);
    } catch (error) {
      console.error('Erro ao detectar duplicatas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível detectar duplicatas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Mesclar dois leads (mantém o mais antigo e atualiza com dados do mais novo)
  const mergeLeads = useCallback(async (keepLeadId: string, deleteLeadId: string) => {
    try {
      const keepLead = duplicates.find(d => d.lead1.id === keepLeadId || d.lead2.id === keepLeadId);
      const deleteLead = duplicates.find(d => d.lead1.id === deleteLeadId || d.lead2.id === deleteLeadId);
      
      if (!keepLead || !deleteLead) return false;

      // Primeiro, transferir pipeline entries do lead que será excluído
      await supabase
        .from('lead_pipeline_entries')
        .update({ lead_id: keepLeadId })
        .eq('lead_id', deleteLeadId);

      // Transferir appointments
      await supabase
        .from('appointments')
        .update({ lead_id: keepLeadId })
        .eq('lead_id', deleteLeadId);

      // Transferir interactions
      await supabase
        .from('interactions')
        .update({ lead_id: keepLeadId })
        .eq('lead_id', deleteLeadId);

      // Transferir notes
      await supabase
        .from('lead_notes')
        .update({ lead_id: keepLeadId })
        .eq('lead_id', deleteLeadId);

      // Excluir lead duplicado
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', deleteLeadId);

      if (error) throw error;

      // Remover par da lista local
      setDuplicates(prev => prev.filter(d => 
        d.lead1.id !== deleteLeadId && d.lead2.id !== deleteLeadId
      ));

      toast({
        title: 'Leads mesclados',
        description: 'Os dados foram consolidados com sucesso',
      });

      return true;
    } catch (error) {
      console.error('Erro ao mesclar leads:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível mesclar os leads',
        variant: 'destructive'
      });
      return false;
    }
  }, [duplicates, toast]);

  // Marcar como não duplicados (apenas remove da lista local)
  const markAsNotDuplicate = useCallback((lead1Id: string, lead2Id: string) => {
    setDuplicates(prev => prev.filter(d => 
      !(d.lead1.id === lead1Id && d.lead2.id === lead2Id) &&
      !(d.lead1.id === lead2Id && d.lead2.id === lead1Id)
    ));
    toast({
      title: 'Removido da lista',
      description: 'Os leads foram marcados como distintos',
    });
  }, [toast]);

  // Excluir um lead duplicado
  const deleteDuplicateLead = useCallback(async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      setDuplicates(prev => prev.filter(d => 
        d.lead1.id !== leadId && d.lead2.id !== leadId
      ));

      toast({
        title: 'Lead excluído',
        description: 'O lead duplicado foi removido',
      });

      return true;
    } catch (error) {
      console.error('Erro ao excluir lead:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o lead',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  // Carregar duplicatas ao montar
  useEffect(() => {
    detectDuplicates();
  }, [detectDuplicates]);

  return {
    duplicates,
    loading,
    detectDuplicates,
    mergeLeads,
    markAsNotDuplicate,
    deleteDuplicateLead
  };
}
