import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PipelineSelector } from '@/components/pipeline/PipelineSelector';
import { DragDropKanban } from './DragDropKanban';
import { ChecklistDialog } from '@/components/pipeline/ChecklistDialog';
import { DealLossDialog } from '@/components/deals/DealLossDialog';
import { AuditLogsDialog } from '@/components/audit/AuditLogsDialog';
import { AppointmentDialog } from '@/components/appointment/AppointmentDialog';
import { InteractionDialog } from '@/components/interaction/InteractionDialog';
import { ChecklistValidation } from '@/components/checklist/ChecklistValidation';
import { AdvancedPipelineForm } from '@/components/forms/AdvancedPipelineForm';
import { usePipelineAutomation } from '@/hooks/usePipelineAutomation';
import { useValidatedAdvancement } from '@/hooks/useValidatedAdvancement';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { useSupabaseLeadPipelineEntries } from '@/hooks/useSupabaseLeadPipelineEntries';
import { useMultiPipeline } from '@/hooks/useMultiPipeline';
import { useSupabaseLeadStageManagement } from '@/hooks/useSupabaseLeadStageManagement';
import { useSupabasePipelineStages } from '@/hooks/useSupabasePipelineStages';
import { useSupabaseChecklistItems } from '@/hooks/useSupabaseChecklistItems';
import { 
  DragDropResult,
  LeadPipelineEntry,
  Lead,
  PipelineStage,
  Pipeline,
  DealLostReason 
} from '@/types/crm';
import { useAudit } from '@/contexts/AuditContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Filter, 
  Search, 
  RotateCcw,
  Users,
  TrendingUp,
  History,
  Plus
} from 'lucide-react';

export function EnhancedPipelineKanban() {
  const navigate = useNavigate();
  const { pipelines, loading: pipelinesLoading, savePipeline } = useSupabasePipelines();
  const { leads } = useSupabaseLeads();
  
  console.log('EnhancedPipelineKanban render:', { pipelines, pipelinesLoading });
  
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [isNewPipelineDialogOpen, setIsNewPipelineDialogOpen] = useState(false);

  // Update selectedPipelineId when pipelines are loaded
  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipelineId) {
      const primaryPipeline = pipelines.find(p => p.primary_pipeline && p.ativo);
      const defaultPipeline = primaryPipeline || pipelines.find(p => p.ativo) || pipelines[0];
      if (defaultPipeline) {
        setSelectedPipelineId(defaultPipeline.id);
      }
    }
  }, [pipelines, selectedPipelineId]);

  // Use real Supabase hooks
  const { entries, refetch: refetchEntries } = useSupabaseLeadPipelineEntries(selectedPipelineId);
  const { advanceStage } = useMultiPipeline();
  const { stages } = useSupabasePipelineStages(selectedPipelineId);
  const { checklistItems } = useSupabaseChecklistItems();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCloser, setFilterCloser] = useState<string>('all');
  const [filterScore, setFilterScore] = useState<string>('all');
  const [filterHealth, setFilterHealth] = useState<string>('all');
  
  // Dialog states
  const [checklistDialog, setChecklistDialog] = useState<{
    open: boolean;
    entry?: LeadPipelineEntry & { lead: Lead };
    stage?: PipelineStage;
  }>({ open: false });
  const [auditDialog, setAuditDialog] = useState(false);
  const [appointmentDialog, setAppointmentDialog] = useState<{
    open: boolean;
    leadId?: string;
    leadName?: string;
  }>({ open: false });
  const [interactionDialog, setInteractionDialog] = useState<{
    open: boolean;
    leadId?: string;
    leadName?: string;
  }>({ open: false });

  const { logChange } = useAudit();
  const { toast } = useToast();
  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);
  const { processStageAdvancement, checkSLAViolations } = usePipelineAutomation(selectedPipelineId || '');
  const { attemptStageAdvancement } = useValidatedAdvancement();

  // Buscar stages ordenadas
  const pipelineStages = stages
    .filter((stage: any) => stage.pipeline_id === selectedPipelineId)
    .sort((a: any, b: any) => a.ordem - b.ordem);

  // Buscar entries ativas e aplicar filtros
  const allEntries = entries
    .filter(entry => 
      entry.status_inscricao === 'Ativo' && 
      entry.pipeline_id === selectedPipelineId
    )
    .map(entry => {
      const lead = leads.find(l => l.id === entry.lead_id);
      return lead ? { ...entry, lead } : null;
    })
    .filter(Boolean)
    .filter(entry => {
      if (!entry) return false;
      
      // Filtro de busca
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

  // Agrupar entries por stage
  const stageEntries = pipelineStages.map(stage => {
    const entries = allEntries.filter(entry => entry?.etapa_atual_id === stage.id);
    const wipExceeded = stage.wip_limit ? entries.length > stage.wip_limit : false;
    
    return {
      stage,
      entries: entries as Array<typeof allEntries[0] & { lead: typeof leads[0] }>,
      wipExceeded
    };
  });

  // Obter closers únicos
  const closers = Array.from(new Set(leads.map(l => l.closer).filter(Boolean)));

  // Métricas do pipeline
  const totalLeads = allEntries.length;
  const leadsAtrasados = allEntries.filter(e => e && e.dias_em_atraso > 0).length;
  const tempoMedioEtapa = totalLeads > 0 
    ? Math.round(allEntries.reduce((acc, e) => acc + (e?.tempo_em_etapa_dias || 0), 0) / totalLeads)
    : 0;

  // Event Handlers
  const handleDragEnd = async (result: DragDropResult) => {
    const { fromStage, toStage, entryId } = result;
    
    if (fromStage === toStage) return;

    const fromStageData = pipelineStages.find(s => s.id === fromStage);
    const toStageData = pipelineStages.find(s => s.id === toStage);
    
    if (!fromStageData || !toStageData) return;

    try {
      // Atualizar a etapa na base de dados
      await advanceStage(entryId, toStage);

      // Log da movimentação
      logChange({
        entidade: 'LeadPipelineEntry',
        entidade_id: entryId,
        alteracao: [
          { 
            campo: 'etapa_atual_id', 
            de: fromStage, 
            para: toStage 
          },
          {
            campo: 'data_entrada_etapa',
            de: new Date().toISOString(),
            para: new Date().toISOString()
          }
        ],
        ator: 'Sistema (Drag & Drop)'
      });

      toast({
        title: 'Lead movido',
        description: `Lead movido de "${fromStageData.nome}" para "${toStageData.nome}"`,
      });

      // Force refresh to ensure UI updates immediately
      if (refetchEntries) {
        refetchEntries();
      }
    } catch (error) {
      console.error('Erro ao mover lead:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível mover o lead. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const handleViewLead = (leadId: string) => {
    window.open(`/leads/${leadId}`, '_blank');
  };

  const handleCreateAppointment = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setAppointmentDialog({
        open: true,
        leadId,
        leadName: lead.nome
      });
    }
  };

  const handleAdvanceStage = (entryId: string) => {
    const entry = allEntries.find(e => e?.id === entryId);
    const stage = pipelineStages.find(s => s.id === entry?.etapa_atual_id);
    
    if (entry && stage) {
      // Check checklist validation
      const stageChecklistItems = checklistItems.filter(item => item.stage_id === stage.id);
      const validation = ChecklistValidation.validateStageAdvancement(entry as any, stageChecklistItems);
      
      if (!validation.valid) {
        toast({
          title: 'Não é possível avançar',
          description: validation.errors[0],
          variant: 'destructive'
        });
        return;
      }

      setChecklistDialog({
        open: true,
        entry: entry as any,
        stage
      });
    }
  };

  const handleRegisterInteraction = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setInteractionDialog({
        open: true,
        leadId,
        leadName: lead.nome
      });
    }
  };

  const handleOpenChecklist = (entryId: string) => {
    const entry = allEntries.find(e => e?.id === entryId);
    const stage = pipelineStages.find(s => s.id === entry?.etapa_atual_id);
    
    if (entry && stage) {
      setChecklistDialog({
        open: true,
        entry: entry as any,
        stage
      });
    }
  };

  const handleUpdateChecklist = (checklistState: Record<string, boolean>) => {
    if (!checklistDialog.entry) return;

    logChange({
      entidade: 'LeadPipelineEntry',
      entidade_id: checklistDialog.entry.id,
      alteracao: [
        { 
          campo: 'checklist_state', 
          de: JSON.stringify(checklistDialog.entry.checklist_state), 
          para: JSON.stringify(checklistState) 
        }
      ]
    });
  };

  const handleUpdateNote = (note: string) => {
    if (!checklistDialog.entry) return;

    logChange({
      entidade: 'LeadPipelineEntry',
      entidade_id: checklistDialog.entry.id,
      alteracao: [
        { 
          campo: 'nota_etapa', 
          de: checklistDialog.entry.nota_etapa || '', 
          para: note 
        }
      ]
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCloser('all');
    setFilterScore('all');
    setFilterHealth('all');
  };

  const handleConfigurePipeline = () => {
    navigate('/settings');
  };

  const handleCreatePipeline = () => {
    setIsNewPipelineDialogOpen(true);
  };

  const handleSaveNewPipeline = async (pipelineData: any) => {
    await savePipeline(pipelineData);
    setIsNewPipelineDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header com Seletor de Pipeline */}
      <PipelineSelector
        pipelines={pipelines as any}
        selectedPipelineId={selectedPipelineId}
        onPipelineChange={setSelectedPipelineId}
        onConfigurePipeline={handleConfigurePipeline}
        onCreatePipeline={handleCreatePipeline}
      />

      {/* Métricas Rápidas */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{totalLeads} leads</span>
        </div>
        {leadsAtrasados > 0 && (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-danger" />
            <span className="text-sm font-medium text-danger">{leadsAtrasados} atrasados</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Tempo médio: {tempoMedioEtapa} dias
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setAuditDialog(true)}
          className="ml-auto"
        >
          <History className="h-4 w-4 mr-2" />
          Ver Logs
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filtros
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
                  <SelectItem key={`closer-${index}`} value={closer as string}>
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
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="ml-auto"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Kanban com Drag & Drop */}
      <DragDropKanban
        stageEntries={stageEntries as any}
        onDragEnd={handleDragEnd}
        onViewLead={handleViewLead}
        onCreateAppointment={handleCreateAppointment}
        onAdvanceStage={handleAdvanceStage}
        onRegisterInteraction={handleRegisterInteraction}
      />

      {/* Dialogs */}
      {checklistDialog.entry && checklistDialog.stage && (
        <ChecklistDialog
          open={checklistDialog.open}
          onOpenChange={(open) => setChecklistDialog({ open })}
          entry={checklistDialog.entry}
          stage={checklistDialog.stage}
          checklistItems={checklistItems}
          onUpdateChecklist={handleUpdateChecklist}
          onUpdateNote={handleUpdateNote}
          onAdvanceStage={async () => {
            if (checklistDialog.entry && checklistDialog.stage) {
              const result = await attemptStageAdvancement(
                checklistDialog.entry,
                checklistDialog.stage,
                checklistItems.filter(item => item.stage_id === checklistDialog.stage!.id)
              );
              
              if (result.success) {
                toast({ 
                  title: 'Sucesso', 
                  description: result.message 
                });
                setChecklistDialog({ open: false });
              } else {
                toast({ 
                  title: 'Não foi possível avançar', 
                  description: result.message,
                  variant: 'destructive'
                });
              }
            }
          }}
        />
      )}

      <AuditLogsDialog
        open={auditDialog}
        onOpenChange={setAuditDialog}
      />

      <AppointmentDialog
        open={appointmentDialog.open}
        onOpenChange={(open) => setAppointmentDialog({ open })}
        leadId={appointmentDialog.leadId || ''}
        leadName={appointmentDialog.leadName || ''}
        onSave={(appointment) => {
          console.log('Agendamento criado:', appointment);
          toast({
            title: 'Agendamento criado',
            description: `Sessão agendada para ${appointmentDialog.leadName}`,
          });
          setAppointmentDialog({ open: false });
        }}
      />

      <InteractionDialog
        open={interactionDialog.open}
        onOpenChange={(open) => setInteractionDialog({ open })}
        leadId={interactionDialog.leadId || ''}
        leadName={interactionDialog.leadName || ''}
        onSave={(interaction) => {
          console.log('Interação registrada:', interaction);
          toast({
            title: 'Interação registrada',
            description: `Interação registrada para ${interactionDialog.leadName}`,
          });
          setInteractionDialog({ open: false });
        }}
      />

      {/* Dialog para Novo Pipeline */}
      <Dialog open={isNewPipelineDialogOpen} onOpenChange={setIsNewPipelineDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Pipeline</DialogTitle>
          </DialogHeader>
          <AdvancedPipelineForm
            onSave={handleSaveNewPipeline}
            onCancel={() => setIsNewPipelineDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}