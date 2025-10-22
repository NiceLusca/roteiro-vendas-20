import { useParams, useNavigate } from 'react-router-dom';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { PipelineSelector } from '@/components/pipeline/PipelineSelector';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { useSupabaseLeadPipelineEntries } from '@/hooks/useSupabaseLeadPipelineEntries';
import { useSupabasePipelineStages } from '@/hooks/useSupabasePipelineStages';
import { useKanbanAppointments } from '@/hooks/useKanbanAppointments';
import { EnhancedLoading } from '@/components/ui/enhanced-loading';
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
  const [pipelineLoading, setPipelineLoading] = useState(true);
  
  // Buscar pipeline por slug
  useEffect(() => {
    const loadPipeline = async () => {
      setPipelineLoading(true);
      const pipeline = await getPipelineBySlug(slug);
      setCurrentPipeline(pipeline);
      setPipelineLoading(false);
      
      // Se pipeline não existe, redirecionar para seletor
      if (!pipeline) {
        navigate('/pipelines/select', { replace: true });
      }
    };
    loadPipeline();
  }, [slug, getPipelineBySlug, navigate]);

  const pipelineId = currentPipeline?.id;
  
  // Só buscar dados se temos um pipelineId válido
  const { leads, refetch: refetchLeads } = useSupabaseLeads();
  const entries = useSupabaseLeadPipelineEntries(pipelineId || '');
  const leadPipelineEntries = entries.entries;
  const { stages } = useSupabasePipelineStages(pipelineId || '');
  const { fetchNextAppointments, getNextAppointmentForLead } = useKanbanAppointments();
  const { moveLead } = useLeadMovement();
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [stageJumpDialogState, setStageJumpDialogState] = useState<{
    open: boolean;
    entryId: string | null;
  }>({ open: false, entryId: null });
  
  // Estados para busca e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCloser, setFilterCloser] = useState<string>('all');
  const [filterScore, setFilterScore] = useState<string>('all');
  const [filterHealth, setFilterHealth] = useState<string>('all');

  // ✅ Usar ref para estabilizar entries.refetch
  const refetchEntriesRef = useRef(entries.refetch);
  useEffect(() => {
    refetchEntriesRef.current = entries.refetch;
  }, [entries.refetch]);

  // ✅ TODOS OS useCallback ANTES de qualquer return condicional
  const handleRefresh = useCallback(async () => {
    console.log('🔄 [Pipelines] Forçando refetch explícito');
    await Promise.all([
      refetchEntriesRef.current(pipelineId),
      refetchLeads()
    ]);
    console.log('✅ [Pipelines] Refetch concluído');
  }, [pipelineId, refetchLeads]);

  // Handler para avançar etapa via botão
  const handleAdvanceStage = useCallback(async (entryId: string) => {
    const entry = leadPipelineEntries
      .filter(e => e.status_inscricao === 'Ativo' && e.pipeline_id === pipelineId)
      .map(e => {
        const lead = leads.find(l => l.id === e.lead_id);
        return lead ? { ...e, lead } : null;
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .find(e => e.id === entryId);
      
    if (!entry) return;
    
    const pipelineStages = stages
      .filter(stage => stage.pipeline_id === pipelineId)
      .sort((a, b) => a.ordem - b.ordem);
    
    const currentStageIndex = pipelineStages.findIndex(s => s.id === entry.etapa_atual_id);
    const currentStage = pipelineStages[currentStageIndex];
    const nextStage = pipelineStages[currentStageIndex + 1];
    
    if (!currentStage || !nextStage) return;
    
    await moveLead({
      entry,
      fromStage: currentStage,
      toStage: nextStage,
      checklistItems: [],
      currentEntriesInTargetStage: 0,
      onSuccess: handleRefresh
    });
  }, [leadPipelineEntries, pipelineId, leads, stages, moveLead, handleRefresh]);

  // Handler para regredir etapa via botão
  const handleRegressStage = useCallback(async (entryId: string) => {
    const entry = leadPipelineEntries
      .filter(e => e.status_inscricao === 'Ativo' && e.pipeline_id === pipelineId)
      .map(e => {
        const lead = leads.find(l => l.id === e.lead_id);
        return lead ? { ...e, lead } : null;
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .find(e => e.id === entryId);
      
    if (!entry) return;
    
    const pipelineStages = stages
      .filter(stage => stage.pipeline_id === pipelineId)
      .sort((a, b) => a.ordem - b.ordem);
    
    const currentStageIndex = pipelineStages.findIndex(s => s.id === entry.etapa_atual_id);
    const currentStage = pipelineStages[currentStageIndex];
    const previousStage = pipelineStages[currentStageIndex - 1];
    
    if (!currentStage || !previousStage) return;
    
    await moveLead({
      entry,
      fromStage: currentStage,
      toStage: previousStage,
      checklistItems: [],
      currentEntriesInTargetStage: 0,
      onSuccess: handleRefresh
    });
  }, [leadPipelineEntries, pipelineId, leads, stages, moveLead, handleRefresh]);

  // Handler para abrir modal de pulo de etapas
  const handleJumpToStage = useCallback((entryId: string) => {
    setStageJumpDialogState({ open: true, entryId });
  }, []);

  // Handler para confirmar pulo de etapas
  const handleConfirmJump = useCallback(async (targetStageId: string) => {
    if (!stageJumpDialogState.entryId) return;
    
    const allEntries = leadPipelineEntries
      .filter(e => e.status_inscricao === 'Ativo' && e.pipeline_id === pipelineId)
      .map(e => {
        const lead = leads.find(l => l.id === e.lead_id);
        return lead ? { ...e, lead } : null;
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);
    
    const entry = allEntries.find(e => e.id === stageJumpDialogState.entryId);
    if (!entry) return;
    
    const pipelineStages = stages
      .filter(stage => stage.pipeline_id === pipelineId)
      .sort((a, b) => a.ordem - b.ordem);
    
    const fromStage = pipelineStages.find(s => s.id === entry.etapa_atual_id);
    const toStage = pipelineStages.find(s => s.id === targetStageId);
    
    if (!fromStage || !toStage) return;
    
    await moveLead({
      entry,
      fromStage,
      toStage,
      checklistItems: [],
      currentEntriesInTargetStage: allEntries.filter(e => e.etapa_atual_id === targetStageId).length,
      onSuccess: () => {
        setStageJumpDialogState({ open: false, entryId: null });
        handleRefresh();
      }
    });
  }, [stageJumpDialogState.entryId, leadPipelineEntries, pipelineId, leads, stages, moveLead, handleRefresh]);

  // Handler para abrir modal de edição
  const handleViewOrEditLead = useCallback((leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setEditingLead(lead);
    }
  }, [leads]);

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

  // ✅ TODOS OS useMemo ANTES de qualquer return condicional
  const pipelineStages = useMemo(() => 
    stages
      .filter(stage => stage.pipeline_id === pipelineId)
      .sort((a, b) => a.ordem - b.ordem),
    [stages, pipelineId]
  );

  const allEntries = useMemo(() => 
    leadPipelineEntries
      .filter(entry => entry.status_inscricao === 'Ativo' && entry.pipeline_id === pipelineId)
      .map(entry => {
        const lead = leads.find(l => l.id === entry.lead_id);
        return lead ? { ...entry, lead } : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .filter(entry => {
        if (searchTerm && !entry.lead.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        if (filterCloser !== 'all' && entry.lead.closer !== filterCloser) {
          return false;
        }
        if (filterScore !== 'all' && entry.lead.lead_score_classification !== filterScore) {
          return false;
        }
        if (filterHealth !== 'all' && entry.saude_etapa !== filterHealth) {
          return false;
        }
        return true;
      }),
    [leadPipelineEntries, pipelineId, leads, searchTerm, filterCloser, filterScore, filterHealth]
  );

  const closers = useMemo(() => 
    Array.from(new Set(leads.map(l => l.closer).filter(Boolean))),
    [leads]
  );

  const activePipelines = useMemo(() => 
    pipelines.filter(p => p.ativo),
    [pipelines]
  );

  const leadIds = useMemo(() => 
    allEntries.map(entry => entry.lead_id), 
    [allEntries]
  );

  const stageEntries = useMemo(() => {
    // Capturar a função uma vez no início do useMemo
    const getAppointment = getNextAppointmentForLead;
    
    return pipelineStages.map((stage, index) => {
      const entries = allEntries.filter(entry => entry.etapa_atual_id === stage.id);
      const wipExceeded = stage.wip_limit ? entries.length > stage.wip_limit : false;
      const nextStage = index < pipelineStages.length - 1 ? pipelineStages[index + 1] : null;

      const entriesWithAppointments = entries.map(entry => ({
        ...entry,
        nextAppointment: getAppointment(entry.lead_id)
      }));

      return {
        stage,
        nextStage,
        entries: entriesWithAppointments,
        wipExceeded
      };
    });
  }, [pipelineStages, allEntries]);

  // ✅ useEffect DEPOIS de todos os useMemo mas ANTES dos returns
  useEffect(() => {
    if (currentPipeline) {
      sessionStorage.setItem(`pipeline_${pipelineId}_name`, currentPipeline.nome);
    }
  }, [currentPipeline, pipelineId]);

  useEffect(() => {
    if (leadIds.length === 0) return;
    fetchNextAppointments(leadIds);
  }, [leadIds, fetchNextAppointments]);

  // ✅ AGORA SIM: RETURNS CONDICIONAIS (depois de TODOS os hooks)
  if (pipelineLoading || !currentPipeline) {
    return <EnhancedLoading loading={true}><></></EnhancedLoading>;
  }

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
                    onChange={(e) => setSearchTerm(e.target.value)}
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
          key={`kanban-${pipelineId}-${allEntries.length}`}
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
        entry={allEntries.find(e => e.id === stageJumpDialogState.entryId)}
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

  // Memoizar activePipelines para evitar re-renders infinitos
  const activePipelines = useMemo(() => 
    pipelines.filter(p => p.ativo), 
    [pipelines]
  );

  // Redirecionar para seleção se necessário
  useEffect(() => {
    if (!loading && !slug && activePipelines.length > 0) {
      navigate('/pipelines/select', { replace: true });
    }
  }, [loading, slug, activePipelines.length, navigate]); // Usar length ao invés do array

  if (loading) {
    return <EnhancedLoading loading={true}><></></EnhancedLoading>;
  }

  if (!slug) {
    return null;
  }

  return <PipelinesContent slug={slug} />;
}
