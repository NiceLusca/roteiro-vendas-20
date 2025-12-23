import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { logger } from '@/utils/logger';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { PipelineTableView } from '@/components/pipeline/PipelineTableView';
import { PipelineSelector } from '@/components/pipeline/PipelineSelector';
import { AccessDenied } from '@/components/access/AccessDenied';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { useSupabaseLeadPipelineEntries } from '@/hooks/useSupabaseLeadPipelineEntries';
import { useSupabasePipelineStages } from '@/hooks/useSupabasePipelineStages';
import { useKanbanAppointments } from '@/hooks/useKanbanAppointments';
import { useMultipleLeadResponsibles } from '@/hooks/useLeadResponsibles';
import { useLeadTags } from '@/hooks/useLeadTags';
import { useMultipleLeadTags } from '@/hooks/useLeadTagsBulk';
import { usePipelineAccess } from '@/hooks/usePipelineAccess';
import { EnhancedLoading, SmartSkeleton } from '@/components/ui/enhanced-loading';
import { KanbanSkeleton } from '@/components/ui/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ArrowLeft, Filter, Search, RotateCcw, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useLeadMovement } from '@/hooks/useLeadMovement';
import { useMultiPipeline } from '@/hooks/useMultiPipeline';
import { LeadEditDialog } from '@/components/kanban/LeadEditDialog';
import { StageJumpDialog } from '@/components/pipeline/StageJumpDialog';
import { UnsubscribeConfirmDialog } from '@/components/pipeline/UnsubscribeConfirmDialog';
import { Lead } from '@/types/crm';

// Componente que usa hooks do CRM (já está dentro do CRMProviderWrapper do App.tsx)
function PipelinesContent({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { pipelines, getPipelineBySlug } = useSupabasePipelines();
  const { isAdmin, canAccessPipeline, canEditPipeline, getAccessLevel, loading: accessLoading } = usePipelineAccess();
  const [currentPipeline, setCurrentPipeline] = useState<any>(null);
  const [loadingPipeline, setLoadingPipeline] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  
  // Verificar acesso ao pipeline carregado
  useEffect(() => {
    const loadPipeline = async () => {
      setLoadingPipeline(true);
      setAccessDenied(false);
      const pipeline = await getPipelineBySlug(slug);
      setCurrentPipeline(pipeline);
      
      // Verificar acesso se não é admin e pipeline foi carregado
      if (pipeline && !accessLoading && !isAdmin) {
        const hasAccess = canAccessPipeline(pipeline.id);
        if (!hasAccess) {
          setAccessDenied(true);
        }
      }
      
      setLoadingPipeline(false);
    };
    loadPipeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, accessLoading, isAdmin]);

  const pipelineId = currentPipeline?.id;
  const entries = useSupabaseLeadPipelineEntries(pipelineId);
  const leadPipelineEntries = entries.entries;
  const { stages } = useSupabasePipelineStages(pipelineId);
  const { fetchNextAppointments, getNextAppointmentForLead } = useKanbanAppointments();
  const { moveLead } = useLeadMovement();
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [stageJumpDialogState, setStageJumpDialogState] = useState<{
    open: boolean;
    entryId: string | null;
  }>({ open: false, entryId: null });
  const [unsubscribeDialogState, setUnsubscribeDialogState] = useState<{
    open: boolean;
    entryId: string | null;
    leadId: string | null;
    leadName: string;
  }>({ open: false, entryId: null, leadId: null, leadName: '' });
  
  // Estado da visualização (kanban ou tabela)
  const viewMode = searchParams.get('view') || 'kanban';
  
  // Ler filtros da URL (persistência)
  const searchTerm = searchParams.get('search') || '';
  
  const filterScore = searchParams.get('score') || 'all';
  const filterHealth = searchParams.get('health') || 'all';
  const filterResponsibleName = searchParams.get('responsible') || 'all';
  const filterTagName = searchParams.get('tag') || 'all';

  // Buscar todas as tags disponíveis
  const { tags: availableTags, refetch: refetchTags } = useLeadTags();

  // Função para atualizar filtros na URL
  const updateFilter = useCallback((key: string, value: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (value === 'all' || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
      return newParams;
    });
  }, [setSearchParams]);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar entries inicial sem paginação
  useEffect(() => {
    if (pipelineId) {
      // Se há termo de busca na URL, executar busca
      if (searchTerm && searchTerm.length >= 2) {
        entries.searchLeads?.(searchTerm, pipelineId);
      } else {
        entries.refetch(pipelineId, true);
      }
    }
  }, [pipelineId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handler de busca com debounce manual
  const handleSearchChange = useCallback((value: string) => {
    // Atualizar URL imediatamente para feedback visual
    updateFilter('search', value);
    
    if (!pipelineId) return;

    // Limpar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Se busca vazia, carregar todos imediatamente
    if (!value || value.length < 2) {
      entries.refetch(pipelineId, true);
      return;
    }

    // Debounce de 300ms para busca server-side
    searchTimeoutRef.current = setTimeout(() => {
      entries.searchLeads?.(value, pipelineId);
    }, 300);
  }, [pipelineId, entries, updateFilter]);

  // Processar dados com ordenação determinística
  const pipelineStages = stages
    .filter(stage => stage.pipeline_id === pipelineId)
    .sort((a, b) => a.ordem - b.ordem || a.id.localeCompare(b.id));

  // Buscar responsáveis de todos os leads (antes do filtro de responsável)
  const baseLeadIds = useMemo(() => 
    leadPipelineEntries
      .filter(entry => entry.status_inscricao === 'Ativo' && entry.pipeline_id === pipelineId && entry.leads !== null)
      .map(entry => entry.lead_id),
    [leadPipelineEntries, pipelineId]
  );
  const { data: responsiblesMap = {} } = useMultipleLeadResponsibles(baseLeadIds);
  const { data: tagsMap = {}, refetch: refetchTagsMap } = useMultipleLeadTags(baseLeadIds);

  // Handler para atualizar tags
  const handleTagsChange = useCallback(() => {
    refetchTagsMap();
  }, [refetchTagsMap]);

  // Obter responsáveis únicos para o filtro
  const uniqueResponsibles = useMemo(() => {
    const responsibleSet = new Map<string, { user_id: string; display_name: string }>();
    Object.values(responsiblesMap).flat().forEach(r => {
      if (r.user_id && !responsibleSet.has(r.user_id)) {
        responsibleSet.set(r.user_id, { 
          user_id: r.user_id, 
          display_name: r.profile?.full_name || r.profile?.nome || r.profile?.email || 'Sem nome' 
        });
      }
    });
    return Array.from(responsibleSet.values());
  }, [responsiblesMap]);

  // Converter nome do responsável da URL para user_id
  const filterResponsibleId = useMemo(() => {
    if (filterResponsibleName === 'all') return 'all';
    const found = uniqueResponsibles.find(r => r.display_name === filterResponsibleName);
    return found?.user_id || 'all';
  }, [filterResponsibleName, uniqueResponsibles]);

  // Converter nome da tag da URL para tag_id
  const filterTagId = useMemo(() => {
    if (filterTagName === 'all') return 'all';
    const found = availableTags.find(t => t.nome === filterTagName);
    return found?.id || 'all';
  }, [filterTagName, availableTags]);

  // ✅ Usar dados do JOIN: entry.leads já contém os dados do lead
  const allEntries = leadPipelineEntries
    .filter(entry => entry.status_inscricao === 'Ativo' && entry.pipeline_id === pipelineId)
    .filter(entry => entry.leads !== null)  // Verificar se JOIN trouxe dados
    .map(entry => ({
      ...entry,
      lead: entry.leads  // Usar dados do JOIN
    }))
    // Aplicar filtros client-side (busca já é server-side)
    .filter(entry => {
      // Filtro de score
      if (filterScore !== 'all' && entry.leads?.lead_score_classification !== filterScore) {
        return false;
      }
      
      // Filtro de saúde
      if (filterHealth !== 'all' && entry.saude_etapa !== filterHealth) {
        return false;
      }
      
      // Filtro de responsável (usando ID convertido do nome)
      if (filterResponsibleId !== 'all') {
        const leadResponsibles = responsiblesMap[entry.lead_id] || [];
        const hasResponsible = leadResponsibles.some(r => r.user_id === filterResponsibleId);
        if (!hasResponsible) {
          return false;
        }
      }

      // Filtro de tag
      if (filterTagId !== 'all') {
        const leadTags = tagsMap[entry.lead_id] || [];
        const hasTag = leadTags.some(t => t.id === filterTagId);
        if (!hasTag) {
          return false;
        }
      }
      
      return true;
    });


  // ✅ Forçar refetch explícito no banco de dados
  const handleRefresh = useCallback(async () => {
    logger.debug('Forçando refetch explícito', {
      feature: 'pipelines',
      metadata: { pipelineId }
    });
    await entries.refetch(pipelineId, true); // Sempre buscar sem paginação
    logger.debug('Refetch concluído', {
      feature: 'pipelines'
    });
  }, [pipelineId]);

  // Handler para avançar etapa via botão
  const handleAdvanceStage = useCallback(async (entryId: string) => {
    console.log('📍 [Pipelines] handleAdvanceStage chamado:', entryId);
    
    const entry = allEntries.find(e => e.id === entryId);
    if (!entry) {
      console.error('❌ Entry não encontrada');
      return;
    }
    
    const currentStageIndex = pipelineStages.findIndex(s => s.id === entry.etapa_atual_id);
    const currentStage = pipelineStages[currentStageIndex];
    // Usar proxima_etapa_id se definido (etapa cíclica), senão usar a próxima na ordem
    const nextStage = currentStage?.proxima_etapa_id
      ? pipelineStages.find(s => s.id === currentStage.proxima_etapa_id)
      : pipelineStages[currentStageIndex + 1];
    
    if (!currentStage || !nextStage) {
      console.error('❌ Stages não encontrados');
      return;
    }
    
    await moveLead({
      entry,
      fromStage: currentStage,
      toStage: nextStage,
      checklistItems: [],
      currentEntriesInTargetStage: 0,
      onSuccess: () => {
        console.log('✅ [Pipelines] Avançou com sucesso');
        handleRefresh();
      }
    });
  }, [allEntries, pipelineStages, moveLead, handleRefresh]);

  // Pipeline já foi carregado pelo useEffect acima (currentPipeline)
  const activePipelines = pipelines.filter(p => p.ativo);

  // Handler para regredir etapa via botão
  const handleRegressStage = useCallback(async (entryId: string) => {
    console.log('📍 [Pipelines] handleRegressStage chamado:', entryId);
    
    const entry = allEntries.find(e => e.id === entryId);
    if (!entry) {
      console.error('❌ Entry não encontrada');
      return;
    }
    
    const currentStageIndex = pipelineStages.findIndex(s => s.id === entry.etapa_atual_id);
    const currentStage = pipelineStages[currentStageIndex];
    const previousStage = pipelineStages[currentStageIndex - 1];
    
    if (!currentStage || !previousStage) {
      console.error('❌ Não há etapa anterior');
      return;
    }
    
    await moveLead({
      entry,
      fromStage: currentStage,
      toStage: previousStage,
      checklistItems: [],
      currentEntriesInTargetStage: 0,
      onSuccess: () => {
        console.log('✅ [Pipelines] Regrediu com sucesso');
        handleRefresh();
      }
    });
  }, [allEntries, pipelineStages, moveLead, handleRefresh]);

  // Handler para abrir modal de pulo de etapas
  const handleJumpToStage = useCallback((entryId: string) => {
    setStageJumpDialogState({ open: true, entryId });
  }, []);

  // Handler para confirmar pulo de etapas
  const handleConfirmJump = useCallback(async (targetStageId: string) => {
    if (!stageJumpDialogState.entryId) return;
    
    const entry = allEntries.find(e => e.id === stageJumpDialogState.entryId);
    if (!entry) {
      console.error('❌ Entry não encontrada');
      return;
    }
    
    const fromStage = pipelineStages.find(s => s.id === entry.etapa_atual_id);
    const toStage = pipelineStages.find(s => s.id === targetStageId);
    
    if (!fromStage || !toStage) {
      console.error('❌ Stages não encontrados');
      return;
    }
    
    await moveLead({
      entry,
      fromStage,
      toStage,
      checklistItems: [],
      currentEntriesInTargetStage: allEntries.filter(e => e.etapa_atual_id === targetStageId).length,
      onSuccess: () => {
        console.log('✅ [Pipelines] Pulou etapas com sucesso');
        setStageJumpDialogState({ open: false, entryId: null });
        handleRefresh();
      }
    });
  }, [stageJumpDialogState.entryId, allEntries, pipelineStages, moveLead, handleRefresh]);

  // Handler para abrir modal de edição
  const handleViewOrEditLead = useCallback((leadId: string) => {
    const entry = allEntries.find(e => e.lead_id === leadId);
    if (entry?.leads) {
      setEditingLead(entry.leads as any);
    }
  }, [allEntries]);

  // Handler para abrir modal de descadastro
  const handleUnsubscribeFromPipeline = useCallback((entryId: string, leadId: string) => {
    const entry = allEntries.find(e => e.id === entryId);
    const leadName = entry?.leads?.nome || 'Lead';
    setUnsubscribeDialogState({ 
      open: true, 
      entryId, 
      leadId,
      leadName 
    });
  }, [allEntries]);

  // Handler para confirmar descadastro
  const handleConfirmUnsubscribe = useCallback(async (reason?: string) => {
    if (!unsubscribeDialogState.entryId) return;
    
    try {
      await entries.archiveEntry(unsubscribeDialogState.entryId);
      setUnsubscribeDialogState({ open: false, entryId: null, leadId: null, leadName: '' });
      handleRefresh();
    } catch (error) {
      console.error('Erro ao descadastrar lead:', error);
    }
  }, [unsubscribeDialogState.entryId, entries, handleRefresh]);

  // Buscar agendamentos
  useEffect(() => {
    if (allEntries.length === 0) return;
    
    const leadIds = allEntries.map(entry => entry.lead_id);
    fetchNextAppointments(leadIds);
  }, [allEntries.length]); // ✅ SOLUÇÃO 2: Removido fetchNextAppointments das dependências

  // Salvar nome do pipeline no sessionStorage para breadcrumb
  useEffect(() => {
    if (currentPipeline) {
      sessionStorage.setItem(`pipeline_${pipelineId}_name`, currentPipeline.nome);
    }
  }, [currentPipeline, pipelineId]);

  // Handlers para PipelineSelector
  const handleConfigurePipeline = useCallback(() => {
    navigate('/settings?tab=pipelines');
  }, [navigate]);

  const handleCreatePipeline = useCallback(() => {
    navigate('/settings?tab=pipelines&action=create');
  }, [navigate]);

  const handlePipelineChange = useCallback((newPipelineId: string) => {
    const selectedPipeline = pipelines.find(p => p.id === newPipelineId);
    if (selectedPipeline) {
      // Preservar query params atuais ao navegar
      const currentParams = searchParams.toString();
      const queryString = currentParams ? `?${currentParams}` : '';
      navigate(`/pipelines/${selectedPipeline.slug}${queryString}`);
    }
  }, [navigate, pipelines, searchParams]);

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  // Handler para adicionar lead em uma etapa específica
  const handleAddLead = useCallback((stageId: string) => {
    logger.debug('Abrindo diálogo para adicionar lead', {
      feature: 'pipelines',
      metadata: { stageId, pipelineId }
    });
    navigate(`/leads?pipeline=${pipelineId}&stage=${stageId}&action=create`);
  }, [navigate, pipelineId]);

  // Mostrar skeleton enquanto carrega
  if (loadingPipeline || accessLoading) {
    return (
      <div className="flex-1 overflow-hidden p-6">
        <KanbanSkeleton />
      </div>
    );
  }

  // Verificar se acesso foi negado
  if (accessDenied) {
    return (
      <AccessDenied 
        title="Acesso Negado ao Pipeline"
        message="Você não tem permissão para acessar este pipeline. Solicite ao administrador para liberar seu acesso."
        showBackButton={true}
        backPath="/pipelines/select"
      />
    );
  }

  // Mostrar erro apenas se realmente não encontrou
  if (!currentPipeline) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Pipeline não encontrado</h2>
          <Button onClick={() => navigate('/pipelines/select')}>
            Voltar para seleção
          </Button>
        </div>
      </div>
    );
  }

  // Determinar se usuário pode editar (para controlar ações no Kanban)
  const canEdit = isAdmin || canEditPipeline(currentPipeline.id);
  const accessLevel = getAccessLevel(currentPipeline.id);

  // Agrupar por stage
  const stageEntries = pipelineStages.map((stage, index) => {
    const entries = allEntries.filter(entry => entry.etapa_atual_id === stage.id);
    const wipExceeded = stage.wip_limit ? entries.length > stage.wip_limit : false;
    // Usar proxima_etapa_id se definido (etapa cíclica), senão usar a próxima na ordem
    const nextStage = stage.proxima_etapa_id
      ? pipelineStages.find(s => s.id === stage.proxima_etapa_id) || null
      : (index < pipelineStages.length - 1 ? pipelineStages[index + 1] : null);

    const entriesWithAppointments = entries.map(entry => ({
      ...entry,
      nextAppointment: getNextAppointmentForLead(entry.lead_id),
      responsibles: responsiblesMap[entry.lead_id] || []
    }));

    return {
      stage,
      nextStage,
      entries: entriesWithAppointments as any,
      wipExceeded
    };
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Barra de Filtros - Topo */}
      <div className="flex-shrink-0 border-b bg-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle Kanban/Tabela - PRIMEIRO com destaque */}
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(v) => v && updateFilter('view', v)}
            className="bg-muted rounded-lg p-1"
          >
            <ToggleGroupItem 
              value="kanban" 
              aria-label="Vista Kanban" 
              className="h-8 px-3 gap-1.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="text-sm font-medium">Kanban</span>
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="table" 
              aria-label="Vista Tabela" 
              className="h-8 px-3 gap-1.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <TableIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Tabela</span>
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="h-6 w-px bg-border" />

          {/* Seletor de Pipeline */}
          <PipelineSelector
            pipelines={activePipelines}
            selectedPipelineId={pipelineId}
            onPipelineChange={handlePipelineChange}
            onConfigurePipeline={handleConfigurePipeline}
            onCreatePipeline={handleCreatePipeline}
          />

          <div className="h-6 w-px bg-border" />

          {/* Busca */}
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          {/* Filtro Responsável - 1ª posição */}
          <Select value={filterResponsibleName} onValueChange={(v) => updateFilter('responsible', v)}>
            <SelectTrigger 
              className={`w-40 h-9 ${
                filterResponsibleName !== 'all' 
                  ? 'border-primary text-primary font-medium' 
                  : ''
              }`}
            >
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">Todos responsáveis</SelectItem>
              {uniqueResponsibles.map((resp) => (
                <SelectItem key={resp.user_id} value={resp.display_name}>
                  {resp.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro Score com cores dinâmicas */}
          <Select value={filterScore} onValueChange={(v) => updateFilter('score', v)}>
            <SelectTrigger 
              className={`w-32 h-9 ${
                filterScore === 'Alto' ? 'border-green-500 text-green-600 font-medium' :
                filterScore === 'Médio' ? 'border-yellow-500 text-yellow-600 font-medium' :
                filterScore === 'Baixo' ? 'border-red-500 text-red-600 font-medium' : ''
              }`}
            >
              <SelectValue placeholder="Score" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">Todos scores</SelectItem>
              <SelectItem value="Alto">
                <span className="text-green-600">Alto</span>
              </SelectItem>
              <SelectItem value="Médio">
                <span className="text-yellow-600">Médio</span>
              </SelectItem>
              <SelectItem value="Baixo">
                <span className="text-red-600">Baixo</span>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro Saúde com cores dinâmicas */}
          <Select value={filterHealth} onValueChange={(v) => updateFilter('health', v)}>
            <SelectTrigger 
              className={`w-32 h-9 ${
                filterHealth === 'Verde' ? 'border-green-500 text-green-600 font-medium' :
                filterHealth === 'Amarelo' ? 'border-yellow-500 text-yellow-600 font-medium' :
                filterHealth === 'Vermelho' ? 'border-red-500 text-red-600 font-medium' : ''
              }`}
            >
              <SelectValue placeholder="Saúde" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">Todas saúdes</SelectItem>
              <SelectItem value="Verde">
                <span className="text-green-600">Verde</span>
              </SelectItem>
              <SelectItem value="Amarelo">
                <span className="text-yellow-600">Amarelo</span>
              </SelectItem>
              <SelectItem value="Vermelho">
                <span className="text-red-600">Vermelho</span>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro Tag com cor dinâmica */}
          <Select value={filterTagName} onValueChange={(v) => updateFilter('tag', v)}>
            <SelectTrigger 
              className={`w-32 h-9 ${filterTagName !== 'all' ? 'font-medium' : ''}`}
              style={filterTagName !== 'all' ? {
                borderColor: availableTags.find(t => t.nome === filterTagName)?.cor || '#3b82f6',
                color: availableTags.find(t => t.nome === filterTagName)?.cor || '#3b82f6'
              } : {}}
            >
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">Todas tags</SelectItem>
              {availableTags.map((tag) => (
                <SelectItem key={tag.id} value={tag.nome}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: tag.cor || '#3b82f6' }}
                    />
                    {tag.nome}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Limpar filtros */}
          {(searchTerm || filterScore !== 'all' || filterHealth !== 'all' || filterResponsibleName !== 'all' || filterTagName !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="h-9"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}

          {/* Contador de resultados */}
          <span className="text-xs text-muted-foreground ml-auto">
            {allEntries.length} lead{allEntries.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Área principal - Kanban ou Tabela */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-4">
        {viewMode === 'kanban' ? (
          <KanbanBoard
            key={`kanban-${pipelineId}`}
            selectedPipelineId={pipelineId}
            stageEntries={stageEntries}
            tagsMap={tagsMap}
            onTagsChange={handleTagsChange}
            onAddLead={handleAddLead}
            onViewLead={handleViewOrEditLead}
            onEditLead={handleViewOrEditLead}
            onAdvanceStage={handleAdvanceStage}
            onJumpToStage={handleJumpToStage}
            onRegressStage={handleRegressStage}
            onUnsubscribeFromPipeline={handleUnsubscribeFromPipeline}
            onRefresh={handleRefresh}
          />
        ) : (
          <PipelineTableView
            stageEntries={stageEntries}
            tagsMap={tagsMap}
            onViewLead={handleViewOrEditLead}
            onAdvanceStage={handleAdvanceStage}
            onRegressStage={handleRegressStage}
            onJumpToStage={handleJumpToStage}
            onUnsubscribeFromPipeline={handleUnsubscribeFromPipeline}
          />
        )}
      </div>

      {editingLead && (
        <LeadEditDialog
          open={!!editingLead}
          onOpenChange={(open) => !open && setEditingLead(null)}
          lead={editingLead}
          onUpdate={handleRefresh}
          currentStageName={pipelineStages.find(s => 
            s.id === allEntries.find(e => e.lead_id === editingLead.id)?.etapa_atual_id
          )?.nome}
          onJumpToStage={() => {
            const entry = allEntries.find(e => e.lead_id === editingLead.id);
            if (entry) {
              setEditingLead(null);
              handleJumpToStage(entry.id);
            }
          }}
        />
      )}

      <StageJumpDialog
        open={stageJumpDialogState.open}
        onOpenChange={(open) => setStageJumpDialogState({ open, entryId: null })}
        entry={allEntries.find(e => e.id === stageJumpDialogState.entryId) as any}
        currentStage={pipelineStages.find(s => 
          s.id === allEntries.find(e => e.id === stageJumpDialogState.entryId)?.etapa_atual_id
        )}
        availableStages={pipelineStages.filter(s => {
          const currentStageId = allEntries.find(e => e.id === stageJumpDialogState.entryId)?.etapa_atual_id;
          return s.id !== currentStageId;
        })}
        onConfirm={handleConfirmJump}
      />

      <UnsubscribeConfirmDialog
        open={unsubscribeDialogState.open}
        onOpenChange={(open) => setUnsubscribeDialogState({ open, entryId: null, leadId: null, leadName: '' })}
        leadName={unsubscribeDialogState.leadName}
        pipelineName={currentPipeline?.nome || ''}
        onConfirm={handleConfirmUnsubscribe}
      />
    </div>
  );
}

// Componente principal com guards
export default function Pipelines() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { pipelines, loading } = useSupabasePipelines();

  const activePipelines = pipelines.filter(p => p.ativo);

  // Redirecionar para seleção se necessário
  useEffect(() => {
    if (!loading && !slug && activePipelines.length > 0) {
      navigate('/pipelines/select', { replace: true });
    }
  }, [loading, slug, activePipelines, navigate]);

  if (loading) {
    return (
      <div className="flex-1 overflow-hidden p-6">
        <KanbanSkeleton />
      </div>
    );
  }

  if (!slug) {
    return null;
  }

  return <PipelinesContent slug={slug} />;
}
