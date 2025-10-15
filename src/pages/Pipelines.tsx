import { useParams, useNavigate } from 'react-router-dom';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { CRMProviderWrapper } from '@/contexts/CRMProviderWrapper';
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
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLeadMovement } from '@/hooks/useLeadMovement';
import { LeadEditDialog } from '@/components/kanban/LeadEditDialog';
import { Lead } from '@/types/crm';

// Camada intermediária que envolve com providers
function PipelinesWithProviders({ pipelineId }: { pipelineId: string }) {
  return (
    <CRMProviderWrapper>
      <PipelinesContent pipelineId={pipelineId} />
    </CRMProviderWrapper>
  );
}

// Componente interno que usa hooks (agora dentro dos providers)
function PipelinesContent({ pipelineId }: { pipelineId: string }) {
  const navigate = useNavigate();
  const { pipelines } = useSupabasePipelines();
  const { leads, refetch: refetchLeads } = useSupabaseLeads();
  const entries = useSupabaseLeadPipelineEntries(pipelineId);
  const leadPipelineEntries = entries.entries;
  const { stages } = useSupabasePipelineStages(pipelineId);
  const { fetchNextAppointments, getNextAppointmentForLead } = useKanbanAppointments();
  const { moveLead } = useLeadMovement();
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  
  // Estados para busca e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCloser, setFilterCloser] = useState<string>('all');
  const [filterScore, setFilterScore] = useState<string>('all');
  const [filterHealth, setFilterHealth] = useState<string>('all');

  // Processar dados
  const pipelineStages = stages
    .filter(stage => stage.pipeline_id === pipelineId)
    .sort((a, b) => a.ordem - b.ordem);

  // ✅ SOLUÇÃO 1: Processamento direto sem useMemo (permite re-renders automáticos)
  const allEntries = leadPipelineEntries
    .filter(entry => entry.status_inscricao === 'Ativo' && entry.pipeline_id === pipelineId)
    .map(entry => {
      const lead = leads.find(l => l.id === entry.lead_id);
      return lead ? { ...entry, lead } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    // Aplicar filtros
    .filter(entry => {
      // Filtro de busca por nome
      if (searchTerm && !entry.lead.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filtro de closer
      if (filterCloser !== 'all' && entry.lead.closer !== filterCloser) {
        return false;
      }
      
      // Filtro de score
      if (filterScore !== 'all' && entry.lead.lead_score_classification !== filterScore) {
        return false;
      }
      
      // Filtro de saúde
      if (filterHealth !== 'all' && entry.saude_etapa !== filterHealth) {
        return false;
      }
      
      return true;
    });

  // Obter closers únicos para o filtro
  const closers = Array.from(new Set(leads.map(l => l.closer).filter(Boolean)));

  // ✅ SOLUÇÃO 2: Forçar refetch explícito no banco de dados
  const handleRefresh = useCallback(async () => {
    console.log('🔄 [Pipelines] Forçando refetch explícito');
    await Promise.all([
      entries.refetch(pipelineId),
      refetchLeads()
    ]);
    console.log('✅ [Pipelines] Refetch concluído');
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

  // Buscar pipeline atual primeiro
  const currentPipeline = pipelines.find(p => p.id === pipelineId);
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

  // Handler para abrir modal de edição
  const handleViewOrEditLead = useCallback((leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setEditingLead(lead);
    }
  }, [leads]);

  // Buscar agendamentos
  useEffect(() => {
    if (allEntries.length === 0) return;
    
    const leadIds = allEntries.map(entry => entry.lead_id);
    fetchNextAppointments(leadIds);
  }, [allEntries.length, fetchNextAppointments]);

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
    navigate(`/pipelines/${newPipelineId}`);
  }, [navigate]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterCloser('all');
    setFilterScore('all');
    setFilterHealth('all');
  }, []);

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
      entries: entriesWithAppointments,
      wipExceeded
    };
  });

  return (
    <div className="space-y-4">
      <div className="px-6 pt-4">
        <PipelineSelector
          pipelines={activePipelines}
          selectedPipelineId={pipelineId}
          onPipelineChange={handlePipelineChange}
          onConfigurePipeline={handleConfigurePipeline}
          onCreatePipeline={handleCreatePipeline}
        />
      </div>
      
      {/* Busca e Filtros */}
      <div className="px-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Buscar e Filtrar Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              {/* Busca */}
              <div className="flex items-center gap-2 min-w-64">
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
                <SelectTrigger className="w-40">
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
                <SelectTrigger className="w-32">
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
                <SelectTrigger className="w-32">
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
      
      <KanbanBoard
        key={`kanban-${pipelineId}-${allEntries.length}-${Date.now()}`}
        selectedPipelineId={pipelineId}
        stageEntries={stageEntries}
        onViewLead={handleViewOrEditLead}
        onEditLead={handleViewOrEditLead}
        onAdvanceStage={handleAdvanceStage}
        onRegressStage={handleRegressStage}
        onRefresh={handleRefresh}
      />

      {editingLead && (
        <LeadEditDialog
          open={!!editingLead}
          onOpenChange={(open) => !open && setEditingLead(null)}
          lead={editingLead}
          onUpdate={handleRefresh}
        />
      )}
    </div>
  );
}

// Componente principal com guards
export default function Pipelines() {
  const { pipelineId } = useParams<{ pipelineId: string }>();
  const navigate = useNavigate();
  const { pipelines, loading } = useSupabasePipelines();

  const activePipelines = pipelines.filter(p => p.ativo);

  // Redirecionar para seleção se necessário
  useEffect(() => {
    if (!loading && !pipelineId && activePipelines.length > 0) {
      navigate('/pipelines/select', { replace: true });
    }
  }, [loading, pipelineId, activePipelines, navigate]);

  if (loading) {
    return <EnhancedLoading loading={true}><></></EnhancedLoading>;
  }

  if (!pipelineId) {
    return null;
  }

  return <PipelinesWithProviders pipelineId={pipelineId} />;
}
