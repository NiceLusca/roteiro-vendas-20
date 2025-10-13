import { useParams, useNavigate } from 'react-router-dom';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { CRMProviderWrapper } from '@/contexts/CRMProviderWrapper';
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

// Componente interno que usa hooks condicionalmente
function PipelinesContent({ pipelineId }: { pipelineId: string }) {
  const navigate = useNavigate();
  const { pipelines } = useSupabasePipelines();
  const { leads } = useSupabaseLeads();
  const { entries: leadPipelineEntries } = useSupabaseLeadPipelineEntries(pipelineId);
  const { stages } = useSupabasePipelineStages(pipelineId);
  const { fetchNextAppointments, getNextAppointmentForLead } = useKanbanAppointments();
  const { moveLead } = useLeadMovement();
  
  // Estado para forçar refresh da UI
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Processar dados
  const pipelineStages = stages
    .filter(stage => stage.pipeline_id === pipelineId)
    .sort((a, b) => a.ordem - b.ordem);

  // ✅ useMemo para reagir a mudanças nos dados
  const allEntries = useMemo(() => {
    console.log('🔄 [Pipelines] Recalculando allEntries:', { 
      pipelineId, 
      entriesCount: leadPipelineEntries.length,
      refreshTrigger 
    });
    
    return leadPipelineEntries
      .filter(entry => entry.status_inscricao === 'Ativo' && entry.pipeline_id === pipelineId)
      .map(entry => {
        const lead = leads.find(l => l.id === entry.lead_id);
        return lead ? { ...entry, lead } : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  }, [pipelineId, leadPipelineEntries, leads, refreshTrigger]);

  // Handler para forçar refresh da UI
  const handleRefresh = useCallback(() => {
    console.log('🔄 [Pipelines] Forçando refresh da UI');
    setRefreshTrigger(prev => prev + 1);
  }, []);

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

  // Buscar agendamentos
  useEffect(() => {
    if (allEntries.length === 0) return;
    
    const leadIds = allEntries.map(entry => entry.lead_id);
    fetchNextAppointments(leadIds);
  }, [allEntries.length, fetchNextAppointments]);

  const currentPipeline = pipelines.find(p => p.id === pipelineId);
  const activePipelines = pipelines.filter(p => p.ativo);

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
    <CRMProviderWrapper>
      <div className="space-y-4">
        {activePipelines.length > 1 && (
          <div className="px-6 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/pipelines/select')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para seleção de pipelines
            </Button>
          </div>
        )}
        
        <KanbanBoard
          key={`kanban-${pipelineId}-${allEntries.length}-${refreshTrigger}`}
          selectedPipelineId={pipelineId}
          stageEntries={stageEntries}
          onViewLead={(leadId) => window.open(`/leads/${leadId}`, '_blank')}
          onAdvanceStage={handleAdvanceStage}
          onRefresh={handleRefresh}
        />
      </div>
    </CRMProviderWrapper>
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

  return <PipelinesContent pipelineId={pipelineId} />;
}
