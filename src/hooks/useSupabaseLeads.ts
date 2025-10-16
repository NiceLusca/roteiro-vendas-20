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
      // Error already handled by toast
    } finally {
      setLoading(false);
    }
  };

  // Save lead - Returns the created/updated lead with ID
  const saveLead = async (leadData: Partial<Lead> & { id?: string }): Promise<Lead | null> => {
    if (!user) return null;

    try {
      const isExplicitUpdate = !!leadData.id;
      
      // Buscar lead existente (se não for uma atualização explícita)
      let existingLead: Lead | null = null;
      let wasUpdate = false;
      
      if (!isExplicitUpdate) {
        existingLead = await findExistingLead(leadData);
      }
      
      let finalData: Partial<Lead>;
      let leadId: string | undefined;
      
      if (existingLead) {
        // Lead já existe - fazer merge e atualizar
        finalData = mergeLeadData(existingLead, leadData);
        leadId = existingLead.id;
        wasUpdate = true;
      } else if (isExplicitUpdate) {
        // Atualização explícita (via edição)
        finalData = leadData;
        leadId = leadData.id;
        wasUpdate = true;
      } else {
        // Lead novo
        finalData = leadData;
        wasUpdate = false;
      }
      
      // Prepare payload with proper field mapping
      const payload: any = {};
      
      // Map all fields from finalData to database format
      Object.keys(finalData).forEach(key => {
        if (key !== 'id' && finalData[key as keyof typeof finalData] !== undefined) {
          payload[key] = finalData[key as keyof typeof finalData];
        }
      });
      
      // Add required fields
      payload.user_id = user.id;
      payload.updated_at = new Date().toISOString();
      
      if (!wasUpdate) {
        payload.created_at = new Date().toISOString();
      }

      let result;
      if (wasUpdate) {
        const { data, error } = await supabase
          .from('leads')
          .update(payload)
          .eq('id', leadId!)
          .select()
          .single();
        
        result = { data, error };
      } else {
        const { data, error } = await supabase
          .from('leads')
          .insert(payload)
          .select()
          .single();
        
        result = { data, error };
      }

      if (result.error) {
        toast({
          title: `Erro ao ${wasUpdate ? 'atualizar' : 'criar'} lead`,
          description: result.error.message,
          variant: "destructive"
        });
        return null;
      }

      // Toast diferenciado para merge automático
      if (existingLead && !isExplicitUpdate) {
        toast({
          title: "Lead atualizado com novos dados",
          description: `Lead ${result.data?.nome} já existia e foi atualizado com as novas informações`,
          variant: "default"
        });
      } else {
        toast({
          title: `Lead ${wasUpdate ? 'atualizado' : 'criado'} com sucesso`,
          description: `Lead ${result.data?.nome} foi ${wasUpdate ? 'atualizado' : 'criado'}`
        });
      }

      // Refresh leads
      fetchLeads();
      
      return {
        ...result.data,
        created_at: new Date(result.data.created_at),
        updated_at: new Date(result.data.updated_at)
      } as Lead;
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      return null;
    }
  };

  // Get lead by ID
  const getLeadById = (id: string): Lead | undefined => {
    return leads.find(lead => lead.id === id);
  };

  /**
   * Busca lead existente no banco usando estratégia de prioridade
   * 1. WhatsApp (mais confiável)
   * 2. Email (se WhatsApp não fornecido)
   * 3. Nome + Origem (menos confiável)
   */
  const findExistingLead = async (leadData: Partial<Lead>): Promise<Lead | null> => {
    try {
      // Estratégia 1: Buscar por WhatsApp (mais confiável)
      if (leadData.whatsapp && leadData.whatsapp.trim() !== '') {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('whatsapp', leadData.whatsapp)
          .maybeSingle();

        if (error) {
          console.error('Erro ao buscar por WhatsApp:', error);
          return null;
        }
        
        if (data) {
          return {
            ...data,
            created_at: new Date(data.created_at),
            updated_at: new Date(data.updated_at)
          } as Lead;
        }
      }

      // Estratégia 2: Buscar por Email
      if (leadData.email && leadData.email.trim() !== '') {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('email', leadData.email)
          .maybeSingle();

        if (error) {
          console.error('Erro ao buscar por Email:', error);
          return null;
        }

        if (data) {
          return {
            ...data,
            created_at: new Date(data.created_at),
            updated_at: new Date(data.updated_at)
          } as Lead;
        }
      }

      // Estratégia 3: Buscar por Nome + Origem (menos confiável)
      if (leadData.nome && leadData.origem && leadData.origem.trim() !== '') {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('nome', leadData.nome)
          .eq('origem', leadData.origem)
          .maybeSingle();

        if (error) {
          console.error('Erro ao buscar por Nome + Origem:', error);
          return null;
        }

        if (data) {
          return {
            ...data,
            created_at: new Date(data.created_at),
            updated_at: new Date(data.updated_at)
          } as Lead;
        }
      }

      return null;
    } catch (error) {
      console.error('Erro fatal ao buscar lead existente:', error);
      return null;
    }
  };

  /**
   * Faz merge inteligente de dados do lead
   * REGRAS:
   * - Campos vazios no novo lead NÃO sobrescrevem campos preenchidos no lead existente
   * - lead_score e valor_lead SEMPRE são atualizados
   * - Tags são ADICIONADAS, não substituídas (via assignTagsToLead)
   */
  const mergeLeadData = (existingLead: Lead, newLeadData: Partial<Lead>): Partial<Lead> => {
    const merged: Partial<Lead> = { ...existingLead };

    // Campos que SEMPRE devem ser atualizados
    const alwaysUpdateFields = ['lead_score', 'valor_lead', 'lead_score_classification'];

    // Campos de texto que só devem ser atualizados se não estiverem vazios
    const textFields = [
      'nome', 'email', 'whatsapp', 'origem', 'segmento', 
      'closer', 'desejo_na_sessao', 'objecao_obs', 'observacoes',
      'resultado_sessao_ultimo', 'resultado_obs_ultima_sessao'
    ];

    // Campos numéricos que só devem ser atualizados se tiverem valor válido
    const numericFields = ['seguidores', 'faturamento_medio', 'meta_faturamento'];

    // Campos booleanos
    const booleanFields = ['ja_vendeu_no_digital'];

    // Campos ENUM
    const enumFields = ['status_geral', 'objecao_principal'];

    // Atualizar campos de SEMPRE atualizar
    alwaysUpdateFields.forEach(field => {
      if (newLeadData[field as keyof Lead] !== undefined) {
        (merged as any)[field] = newLeadData[field as keyof Lead];
      }
    });

    // Atualizar campos de texto (apenas se novo valor não for vazio)
    textFields.forEach(field => {
      const newValue = newLeadData[field as keyof Lead];
      if (newValue && String(newValue).trim() !== '') {
        (merged as any)[field] = newValue;
      }
    });

    // Atualizar campos numéricos (apenas se tiverem valor válido)
    numericFields.forEach(field => {
      const newValue = newLeadData[field as keyof Lead];
      if (newValue !== undefined && newValue !== null && Number(newValue) > 0) {
        (merged as any)[field] = newValue;
      }
    });

    // Atualizar campos booleanos (apenas se estiver explicitamente definido)
    booleanFields.forEach(field => {
      const newValue = newLeadData[field as keyof Lead];
      if (newValue !== undefined && newValue !== null) {
        (merged as any)[field] = newValue;
      }
    });

    // Atualizar campos ENUM
    enumFields.forEach(field => {
      const newValue = newLeadData[field as keyof Lead];
      if (newValue && String(newValue).trim() !== '') {
        (merged as any)[field] = newValue;
      }
    });

    return merged;
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