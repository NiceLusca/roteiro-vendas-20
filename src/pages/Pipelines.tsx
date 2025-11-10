import { useParams, useNavigate } from 'react-router-dom';
import { logger } from '@/utils/logger';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { PipelineSelector } from '@/components/pipeline/PipelineSelector';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { useSupabaseLeadPipelineEntries } from '@/hooks/useSupabaseLeadPipelineEntries';
import { useSupabasePipelineStages } from '@/hooks/useSupabasePipelineStages';
import { useKanbanAppointments } from '@/hooks/useKanbanAppointments';
import { EnhancedLoading, SmartSkeleton } from '@/components/ui/enhanced-loading';
import { KanbanSkeleton } from '@/components/ui/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Filter, Search, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useLeadMovement } from '@/hooks/useLeadMovement';
import { LeadEditDialog } from '@/components/kanban/LeadEditDialog';
import { StageJumpDialog } from '@/components/pipeline/StageJumpDialog';
import { Lead } from '@/types/crm';

// Componente que usa hooks do CRM (já está dentro do CRMProviderWrapper do App.tsx)
function PipelinesContent({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const { pipelines, getPipelineBySlug } = useSupabasePipelines();
  const [currentPipeline, setCurrentPipeline] = useState<any>(null);
  const [loadingPipeline, setLoadingPipeline] = useState(true);
  
  // Buscar pipeline por slug
  // Nota: getPipelineBySlug não está nas dependências para evitar loops de renderização
  useEffect(() => {
    const loadPipeline = async () => {
      setLoadingPipeline(true);
      const pipeline = await getPipelineBySlug(slug);
      setCurrentPipeline(pipeline);
      setLoadingPipeline(false);
    };
    loadPipeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

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
  
  // Estados para busca e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar entries inicial sem paginação
  useEffect(() => {
    if (pipelineId) {
      entries.refetch(pipelineId, true);
    }
  }, [pipelineId]);

  // Handler de busca com debounce manual
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    
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
  }, [pipelineId, entries]);
  const [filterCloser, setFilterCloser] = useState<string>('all');
  const [filterScore, setFilterScore] = useState<string>('all');
  const [filterHealth, setFilterHealth] = useState<string>('all');

  // Processar dados
  const pipelineStages = stages
    .filter(stage => stage.pipeline_id === pipelineId)
    .sort((a, b) => a.ordem - b.ordem);

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
      // Filtro de closer
      if (filterCloser !== 'all' && entry.leads?.closer !== filterCloser) {
        return false;
      }
      
      // Filtro de score
      if (filterScore !== 'all' && entry.leads?.lead_score_classification !== filterScore) {
        return false;
      }
      
      // Filtro de saúde
      if (filterHealth !== 'all' && entry.saude_etapa !== filterHealth) {
        return false;
      }
      
      return true;
    });

  // Obter closers únicos para o filtro
  const closers = Array.from(new Set(
    allEntries
      .map(e => e.leads?.closer)
      .filter(Boolean)
  ));

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
    const nextStage = pipelineStages[currentStageIndex + 1];
    
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
      navigate(`/pipelines/${selectedPipeline.slug}`);
    }
  }, [navigate, pipelines]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterCloser('all');
    setFilterScore('all');
    setFilterHealth('all');
  }, []);

  // Mostrar skeleton enquanto carrega
  if (loadingPipeline) {
    return (
      <div className="flex-1 overflow-hidden p-6">
        <KanbanSkeleton />
      </div>
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

  // Agrupar por stage
  const stageEntries = pipelineStages.map((stage, index) => {
    const entries = allEntries.filter(entry => entry.etapa_atual_id === stage.id);
    const wipExceeded = stage.wip_limit ? entries.length > stage.wip_limit : false;
    const nextStage = index < pipelineStages.length - 1 ? pipelineStages[index + 1] : null;

    const entriesWithAppointments = entries.map(entry => ({
      ...entry,
      nextAppointment: getNextAppointmentForLead(entry.lead_id)
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
      {/* Header Fixo - PipelineSelector + Filtros */}
      <div className="sticky top-0 z-[5] bg-background border-b">
        <div className="px-6 pt-4 pb-4 space-y-4 max-w-full overflow-x-hidden">
          <PipelineSelector
            pipelines={activePipelines}
            selectedPipelineId={pipelineId}
            onPipelineChange={handlePipelineChange}
            onConfigurePipeline={handleConfigurePipeline}
            onCreatePipeline={handleCreatePipeline}
          />
        
          {/* Busca e Filtros */}
          <Card className="overflow-x-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4" />
                Buscar e Filtrar Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 flex-wrap max-w-full">
                {/* Busca */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome do lead..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="flex-1"
                  />
                </div>

                {/* Filtro Closer */}
                <Select value={filterCloser} onValueChange={setFilterCloser}>
                  <SelectTrigger className="w-32 sm:w-40">
                    <SelectValue placeholder="Closer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os closers</SelectItem>
                    {closers.map((closer, index) => (
                      <SelectItem key={closer || index} value={closer as string}>
                        {closer as string}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filtro Score */}
                <Select value={filterScore} onValueChange={setFilterScore}>
                  <SelectTrigger className="w-28 sm:w-32">
                    <SelectValue placeholder="Score" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Alto">Alto</SelectItem>
                    <SelectItem value="Médio">Médio</SelectItem>
                    <SelectItem value="Baixo">Baixo</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtro Saúde */}
                <Select value={filterHealth} onValueChange={setFilterHealth}>
                  <SelectTrigger className="w-28 sm:w-32">
                    <SelectValue placeholder="Saúde" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="Verde">Verde</SelectItem>
                    <SelectItem value="Amarelo">Amarelo</SelectItem>
                    <SelectItem value="Vermelho">Vermelho</SelectItem>
                  </SelectContent>
                </Select>

                {/* Limpar filtros */}
                {(searchTerm || filterCloser !== 'all' || filterScore !== 'all' || filterHealth !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="ml-auto"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                )}
              </div>
              
              {/* Contador de resultados */}
              {searchTerm && (
                <p className="text-sm text-muted-foreground mt-3">
                  {allEntries.length} lead{allEntries.length !== 1 ? 's' : ''} encontrado{allEntries.length !== 1 ? 's' : ''}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Área de Scroll APENAS para o Kanban */}
      <div className="flex-1 overflow-x-auto overflow-y-auto px-6 pt-6 pb-6">
        <KanbanBoard
          key={`kanban-${pipelineId}`}
          selectedPipelineId={pipelineId}
          stageEntries={stageEntries}
          onViewLead={handleViewOrEditLead}
          onEditLead={handleViewOrEditLead}
          onAdvanceStage={handleAdvanceStage}
          onJumpToStage={handleJumpToStage}
          onRegressStage={handleRegressStage}
          onRefresh={handleRefresh}
        />
      </div>

      {editingLead && (
        <LeadEditDialog
          open={!!editingLead}
          onOpenChange={(open) => !open && setEditingLead(null)}
          lead={editingLead}
          onUpdate={handleRefresh}
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
          const currentStageOrder = pipelineStages.find(ps => 
            ps.id === allEntries.find(e => e.id === stageJumpDialogState.entryId)?.etapa_atual_id
          )?.ordem ?? 0;
          return s.ordem > currentStageOrder;
        })}
        onConfirm={handleConfirmJump}
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
