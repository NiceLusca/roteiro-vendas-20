import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';

const LEADS_PER_PAGE = 50;

interface UseOptimizedLeadsOptions {
  page?: number;
  searchTerm?: string;
  filterStatus?: string;
  filterScore?: string;
  filterTag?: string;
}

export function useOptimizedLeads(options: UseOptimizedLeadsOptions = {}) {
  const { page = 1, searchTerm = '', filterStatus = 'all', filterScore = 'all', filterTag = 'all' } = options;
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch leads with pagination and filters
  const {
    data: leadsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['leads', page, searchTerm, filterStatus, filterScore, filterTag, user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
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
          user_id,
          created_at,
          updated_at
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filterStatus !== 'all') {
        query = query.eq('status_geral', filterStatus as any);
      }
      
      if (filterScore !== 'all') {
        query = query.eq('lead_score_classification', filterScore as any);
      }

      // Apply tag filter
      if (filterTag !== 'all') {
        // Filter leads that have the selected tag
        const { data: tagAssignments } = await supabase
          .from('lead_tag_assignments')
          .select('lead_id')
          .eq('tag_id', filterTag);
        
        const leadIdsWithTag = tagAssignments?.map(a => a.lead_id) || [];
        if (leadIdsWithTag.length > 0) {
          query = query.in('id', leadIdsWithTag);
        } else {
          // If no leads have this tag, return empty result
          return { leads: [], totalCount: 0, totalPages: 0 };
        }
      }

      // Apply search with trigram similarity
      if (searchTerm) {
        query = query.or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,whatsapp.ilike.%${searchTerm}%`);
      }

      // Pagination
      const from = (page - 1) * LEADS_PER_PAGE;
      const to = from + LEADS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Fetch tags for all leads in a single query
      const leadIds = data?.map(lead => lead.id) || [];
      let tagsMap: Record<string, any[]> = {};
      
      if (leadIds.length > 0) {
        const { data: tagAssignments } = await supabase
          .from('lead_tag_assignments')
          .select(`
            lead_id,
            lead_tags(id, nome, cor)
          `)
          .in('lead_id', leadIds);
        
        // Create a map of lead_id to tags
        tagAssignments?.forEach(assignment => {
          if (!tagsMap[assignment.lead_id]) {
            tagsMap[assignment.lead_id] = [];
          }
          if (assignment.lead_tags) {
            tagsMap[assignment.lead_id].push(assignment.lead_tags);
          }
        });
      }

      return {
        leads: data?.map(lead => ({
          ...lead,
          created_at: new Date(lead.created_at),
          updated_at: new Date(lead.updated_at),
          tags: tagsMap[lead.id] || []
        })) || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / LEADS_PER_PAGE)
      };
    },
    enabled: !!user,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Mutation for saving leads
  const saveMutation = useMutation({
    mutationFn: async (leadData: Partial<Lead> & { id?: string }) => {
      if (!user) throw new Error('User not authenticated');

      const isUpdate = !!leadData.id;
      
      // Permit only known lead columns
      const allowedKeys = new Set([
        'nome','email','whatsapp','origem','segmento','status_geral','closer','desejo_na_sessao',
        'objecao_principal','objecao_obs','observacoes','ja_vendeu_no_digital','seguidores',
        'faturamento_medio','meta_faturamento','lead_score','lead_score_classification',
        'resultado_sessao_ultimo','resultado_obs_ultima_sessao'
      ] as const);

      const payload: any = {};

      Object.keys(leadData).forEach((key) => {
        if (key === 'id') return;
        if (allowedKeys.has(key as any) && (leadData as any)[key] !== undefined) {
          (payload as any)[key] = (leadData as any)[key];
        }
      });

      // Ensure whatsapp is normalized string
      if (payload.whatsapp && typeof payload.whatsapp === 'string') {
        payload.whatsapp = payload.whatsapp.toString();
      }

      payload.user_id = user.id;
      payload.updated_at = new Date().toISOString();

      if (!isUpdate) {
        payload.created_at = new Date().toISOString();
      }

      if (isUpdate) {
        const { data, error } = await supabase
          .from('leads')
          .update(payload)
          .eq('id', leadData.id!)
          .select('id, nome')
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('leads')
          .insert(payload)
          .select('id, nome')
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data, variables) => {
      const isUpdate = !!variables.id;
      
      toast({
        title: `Lead ${isUpdate ? 'atualizado' : 'criado'} com sucesso`,
        description: `Lead ${data.nome} foi ${isUpdate ? 'atualizado' : 'criado'}`
      });

      // Invalidate and refetch leads
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao salvar lead',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return {
    leads: leadsData?.leads || [],
    totalCount: leadsData?.totalCount || 0,
    totalPages: leadsData?.totalPages || 0,
    currentPage: page,
    isLoading,
    error,
    saveLead: saveMutation.mutate,
    savingLead: saveMutation.isPending,
    refetch
  };
}
