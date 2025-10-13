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
import { ArrowLeft } from 'lucide-react';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLeadMovement } from '@/hooks/useLeadMovement';

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
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

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
      
      <KanbanBoard
        key={`kanban-${pipelineId}-${allEntries.length}-${Date.now()}`}
        selectedPipelineId={pipelineId}
        stageEntries={stageEntries}
        onViewLead={(leadId) => window.open(`/leads/${leadId}`, '_blank')}
        onAdvanceStage={handleAdvanceStage}
        onRegressStage={handleRegressStage}
        onRefresh={handleRefresh}
      />
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
