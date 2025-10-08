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
import { LeadEditDialog } from './LeadEditDialog';
import { ChecklistDialog } from '@/components/pipeline/ChecklistDialog';
import { DealLossDialog } from '@/components/deals/DealLossDialog';
import { AuditLogsDialog } from '@/components/audit/AuditLogsDialog';
import { AppointmentDialog } from '@/components/appointment/AppointmentDialog';
import { EnhancedAppointmentDialog } from '@/components/pipeline/EnhancedAppointmentDialog';
import { InteractionDialog } from '@/components/interaction/InteractionDialog';
import { ChecklistValidation } from '@/components/checklist/ChecklistValidation';
import { PipelineTransferDialog } from '@/components/pipeline/PipelineTransferDialog';
import { SuccessAnimation } from './SuccessAnimation';
import { useMultiPipeline } from '@/hooks/useMultiPipeline';
import { useSupabaseLeadStageManagement } from '@/hooks/useSupabaseLeadStageManagement';
import { useSupabasePipelineStages } from '@/hooks/useSupabasePipelineStages';
import { useSupabaseChecklistItems } from '@/hooks/useSupabaseChecklistItems';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { useSupabaseLeadPipelineEntries } from '@/hooks/useSupabaseLeadPipelineEntries';
import { useLeadData } from '@/hooks/useLeadData';
import { usePipelineAutomation } from '@/hooks/usePipelineAutomation';
import { useValidatedAdvancement } from '@/hooks/useValidatedAdvancement';
import { useKanbanAppointments } from '@/hooks/useKanbanAppointments';
import { usePipelineAppointmentIntegration } from '@/hooks/usePipelineAppointmentIntegration';
import { useSupabaseAppointments } from '@/hooks/useSupabaseAppointments';
import { SimplePipelineForm } from '@/components/forms/SimplePipelineForm';
import { PipelineWizardForm } from '@/components/forms/PipelineWizardForm';
import { LeadForm } from '@/components/forms/LeadForm';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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

interface EnhancedPipelineKanbanProps {
  selectedPipelineId?: string;
}

export function EnhancedPipelineKanban({ selectedPipelineId: propPipelineId }: EnhancedPipelineKanbanProps = {}) {
  const navigate = useNavigate();
  const { pipelines, loading: pipelinesLoading, savePipeline, saveComplexPipeline } = useSupabasePipelines();
  const { leads, refetch: refetchLeads } = useSupabaseLeads();
  
  if (process.env.NODE_ENV === 'development') {
    console.log('EnhancedPipelineKanban render:', { pipelines, pipelinesLoading });
  }
  
  const [internalSelectedPipelineId, setInternalSelectedPipelineId] = useState('');
  const [isNewPipelineDialogOpen, setIsNewPipelineDialogOpen] = useState(false);
  const [isPipelineWizardDialogOpen, setIsPipelineWizardDialogOpen] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState({
    show: false,
    message: ''
  });

  // Validação extra: garantir que não seja string vazia
  const selectedPipelineId = (propPipelineId && propPipelineId.trim() !== '') 
    ? propPipelineId 
    : (internalSelectedPipelineId && internalSelectedPipelineId.trim() !== '')
      ? internalSelectedPipelineId
      : undefined;

  // Update selectedPipelineId when pipelines are loaded
  useEffect(() => {
    if (!propPipelineId && pipelines.length > 0 && !internalSelectedPipelineId) {
      const primaryPipeline = pipelines.find(p => p.primary_pipeline && p.ativo);
      const defaultPipeline = primaryPipeline || pipelines.find(p => p.ativo) || pipelines[0];
      if (defaultPipeline && defaultPipeline.id) {
        setInternalSelectedPipelineId(defaultPipeline.id);
      }
    }
  }, [pipelines, internalSelectedPipelineId, propPipelineId]);

  // Use real Supabase hooks
  const { entries: leadPipelineEntries, updateEntry, refetch } = useSupabaseLeadPipelineEntries(selectedPipelineId);
  const currentPipeline = pipelines.find(p => p.id === selectedPipelineId);
  const { advanceStage, inscribePipeline, transferPipeline } = useMultiPipeline();
  const { saveLead } = useLeadData();
  const { stages } = useSupabasePipelineStages(selectedPipelineId);
  const { checklistItems } = useSupabaseChecklistItems();
  const { fetchNextAppointments, getNextAppointmentForLead } = useKanbanAppointments();
  const { createAutomaticAppointment } = usePipelineAppointmentIntegration();
  const { saveAppointment, refetch: refetchAppointments } = useSupabaseAppointments();
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
    lead?: Lead;
    stage?: PipelineStage;
  }>({ open: false });
  
  const [interactionDialog, setInteractionDialog] = useState<{
    open: boolean;
    leadId?: string;
    leadName?: string;
  }>({ open: false });
  
  // Estado para o diálogo de adicionar lead
  const [addLeadDialog, setAddLeadDialog] = useState<{
    open: boolean;
    stageId: string;
    stageName: string;
  }>({
    open: false,
    stageId: '',
    stageName: ''
  });

  const [transferDialog, setTransferDialog] = useState<{
    open: boolean;
    leadId?: string;
    leadName?: string;
    currentPipelineId?: string;
  }>({ open: false });

  const [editLeadDialog, setEditLeadDialog] = useState<{
    open: boolean;
    lead?: Lead;
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
  const allEntries = leadPipelineEntries
    .filter(entry => 
      entry.status_inscricao === 'Ativo' && 
      entry.pipeline_id === selectedPipelineId
    )
    .map(entry => {
      const lead = leads.find(l => l.id === entry.lead_id);
      return lead ? { ...entry, lead } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => {
      return entry !== null && entry !== undefined && entry.lead !== undefined;
    })
    .filter(entry => {
      // Filtro de busca - safe access to lead.nome
      if (searchTerm && (!entry.lead?.nome || !entry.lead.nome.toLowerCase().includes(searchTerm.toLowerCase()))) {
        return false;
      }
      
      // Filtro de closer
      if (filterCloser !== 'all' && entry.lead?.closer !== filterCloser) {
        return false;
      }
      
      // Filtro de score
      if (filterScore !== 'all' && entry.lead?.lead_score_classification !== filterScore) {
        return false;
      }
      
      // Filtro de saúde
      if (filterHealth !== 'all' && entry.saude_etapa !== filterHealth) {
        return false;
      }
      
      return true;
    });

  // Buscar agendamentos quando mudar pipeline ou leads
  useEffect(() => {
    if (allEntries.length > 0) {
      const leadIds = allEntries.map(entry => entry!.lead_id);
      fetchNextAppointments(leadIds);
    }
  }, [allEntries, fetchNextAppointments]);

  // Agrupar entries por stage
  const stageEntries = pipelineStages.map((stage, index) => {
    const entries = allEntries.filter(entry => entry?.etapa_atual_id === stage.id);
    const wipExceeded = stage.wip_limit ? entries.length > stage.wip_limit : false;
    
    // Determinar o próximo estágio
    const nextStage = index < pipelineStages.length - 1 ? pipelineStages[index + 1] : null;
    
    // Adicionar informações de agendamento para cada entry
    const entriesWithAppointments = entries.map(entry => {
      if (!entry) return null;
      const nextAppointment = getNextAppointmentForLead(entry.lead_id);
      return {
        ...entry,
        nextAppointment
      };
    }).filter(Boolean);
    
    return {
      stage,
      nextStage,
      entries: entriesWithAppointments as Array<typeof allEntries[0] & { lead: typeof leads[0] }>,
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

  // Event Handlers - com update otimista e tratamento robusto de erros
  const handleDragEnd = async (result: DragDropResult) => {
    // Guard: Verificar se pipeline está selecionado
    if (!selectedPipelineId || selectedPipelineId.trim() === '') {
      console.error('❌ Pipeline não selecionado');
      toast({
        title: 'Erro de configuração',
        description: 'Nenhum pipeline selecionado',
        variant: 'destructive',
      });
      return;
    }

    if (!currentPipeline) {
      console.warn('⚠️ Sem pipeline selecionado');
      return;
    }

    if (!result || !result.entryId || !result.toStage) {
      console.warn('⚠️ Resultado do drag inválido:', result);
      return;
    }

    console.log('🎯 handleDragEnd:', {
      selectedPipelineId,
      selectedPipelineIdType: typeof selectedPipelineId,
      selectedPipelineIdLength: selectedPipelineId?.length,
      result
    });

    try {
      // Encontrar entry e stages
      const currentEntry = leadPipelineEntries.find(e => e.id === result.entryId);
      if (!currentEntry) {
        console.error('❌ Entry não encontrada:', result.entryId);
        toast({
          title: 'Erro interno',
          description: 'Entrada do lead não encontrada no sistema',
          variant: 'destructive',
        });
        return;
      }

      const fromStage = pipelineStages.find(s => s.id === result.fromStage);
      const toStage = pipelineStages.find(s => s.id === result.toStage);
      
      if (!fromStage || !toStage) {
        console.error('❌ Estágios não encontrados');
        toast({
          title: 'Erro de configuração',
          description: 'Estágio de origem ou destino não encontrado',
          variant: 'destructive',
        });
        return;
      }

      const leadNome = (currentEntry as any).leads?.nome || 'Lead';
      console.log(`🚀 Movendo "${leadNome}" de "${fromStage.nome}" → "${toStage.nome}"`);

      // Validar checklist ANTES de permitir movimentação
      const stageChecklistItems = checklistItems.filter(item => item.etapa_id === fromStage.id);
      const validation = ChecklistValidation.validateStageAdvancement(currentEntry as any, stageChecklistItems);
      
      if (!validation.valid) {
        console.log('⛔ Checklist obrigatório não completo');
        toast({
          title: 'Checklist pendente',
          description: `Complete o checklist "${fromStage.nome}" antes de avançar:\n${validation.errors[0]}`,
          variant: 'destructive',
          duration: 6000
        });
        return;
      }

      // ✅ UPDATE NO BANCO DE DADOS
      console.log('💾 Salvando no banco...');
      console.log('💾 updateEntry:', {
        entryId: result.entryId,
        updates: {
          etapa_atual_id: result.toStage,
          data_entrada_etapa: new Date().toISOString(),
          tempo_em_etapa_dias: 0,
          dias_em_atraso: 0
        },
        currentPipelineId: selectedPipelineId
      });
      
      const updateResult = await updateEntry(result.entryId, {
        etapa_atual_id: result.toStage,
        data_entrada_etapa: new Date().toISOString(),
        tempo_em_etapa_dias: 0,
        dias_em_atraso: 0
      });

      if (!updateResult) {
        throw new Error('Update não retornou dados do banco');
      }

      console.log('✅ Banco confirmou update:', updateResult.id);

      // Log de auditoria
      logChange({
        entidade: 'LeadPipelineEntry',
        entidade_id: result.entryId,
        alteracao: [
          { campo: 'etapa_atual_id', de: fromStage.nome, para: toStage.nome }
        ]
      });

      // 🔄 REFETCH IMEDIATO para sincronizar UI
      console.log('🔄 Sincronizando dados...');
      await refetch();
      console.log('✅ Dados sincronizados');

      // Feedback de sucesso
      setSuccessAnimation({
        show: true,
        message: `"${leadNome}" → ${toStage.nome}`
      });

      toast({
        title: '✅ Lead movido',
        description: `"${leadNome}" foi movido para "${toStage.nome}"`,
        duration: 3000
      });

    } catch (error) {
      console.error('❌ Erro ao processar movimentação:', error);
      
      // Mensagens específicas por tipo de erro
      let errorMessage = 'Falha ao salvar a movimentação';
      
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          errorMessage = 'Problema de conexão com o servidor';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Você não tem permissão para esta ação';
        } else if (error.message.includes('not found')) {
          errorMessage = 'Lead ou estágio não encontrado';
        }
      }

      toast({
        title: 'Erro ao mover lead',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000
      });

      // Forçar refetch para garantir consistência
      await refetch();
    }
  };

  const handleViewLead = (leadId: string) => {
    window.open(`/leads/${leadId}`, '_blank');
  };

  const handleEditLead = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setEditLeadDialog({
        open: true,
        lead
      });
    }
  };

  const handleCreateAppointment = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    const entry = allEntries.find(e => e?.lead_id === leadId);
    const stage = entry ? pipelineStages.find(s => s.id === entry.etapa_atual_id) : undefined;
    
    if (lead) {
      setAppointmentDialog({
        open: true,
        leadId,
        leadName: lead.nome,
        lead,
        stage
      });
    }
  };

  const handleRegressStage = (entryId: string) => {
    const entry = leadPipelineEntries.find(e => e.id === entryId);
    if (!entry) return;
    
    const currentStageIndex = pipelineStages
      .filter(s => s.pipeline_id === entry.pipeline_id)
      .sort((a, b) => a.ordem - b.ordem)
      .findIndex(s => s.id === entry.etapa_atual_id);
    
    const previousStage = pipelineStages
      .filter(s => s.pipeline_id === entry.pipeline_id)
      .sort((a, b) => a.ordem - b.ordem)[currentStageIndex - 1];
    
    if (previousStage) {
      setChecklistDialog({
        open: true,
        entry: { ...entry, lead: leads.find(l => l.id === entry.lead_id)! } as any,
        stage: previousStage
      });
    }
  };

  const handleTransferPipeline = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    const currentEntry = leadPipelineEntries.find(e => e.lead_id === leadId && e.status_inscricao === 'Ativo');
    
    if (lead && currentEntry) {
      setTransferDialog({
        open: true,
        leadId,
        leadName: lead.nome,
        currentPipelineId: currentEntry.pipeline_id
      });
    }
  };

  const handleAdvanceStage = (entryId: string) => {
    const entry = allEntries.find(e => e?.id === entryId);
    const stage = pipelineStages.find(s => s.id === entry?.etapa_atual_id);
    
    if (entry && stage) {
      // Check checklist validation
      const stageChecklistItems = checklistItems.filter(item => item.etapa_id === stage.id);
      const checklistState: Record<string, boolean> = {};
      const validation = ChecklistValidation.validateStageAdvancement(entry as any, stageChecklistItems);
      
      if (!validation.valid) {
        toast({
          title: '🚫 Avanço bloqueado',
          description: `${validation.errors[0]}\n\n📋 Complete todos os itens obrigatórios do checklist para prosseguir.`,
          variant: 'destructive',
          duration: 5000
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

  const handleAddLead = (stageId: string) => {
    const stage = pipelineStages.find(s => s.id === stageId);
    if (stage) {
      setAddLeadDialog({
        open: true,
        stageId,
        stageName: stage.nome
      });
    }
  };

  const handleAddLeadSubmit = async (leadData: Partial<Lead>) => {
    // Validação crítica antes de iniciar
    if (!addLeadDialog.stageId) {
      console.error('❌ stageId está vazio!');
      toast({
        title: 'Erro de configuração',
        description: 'Etapa não identificada. Por favor, tente novamente.',
        variant: 'destructive'
      });
      return;
    }

    console.log('📍 Iniciando criação de lead:', {
      leadData,
      stageId: addLeadDialog.stageId,
      stageName: addLeadDialog.stageName,
      pipelineId: selectedPipelineId
    });

    try {
      // Salvar o lead e obter o ID retornado
      const createdLead = await saveLead(leadData);
      
      if (!createdLead || !createdLead.id) {
        throw new Error('Lead criado mas sem ID retornado');
      }

      console.log('✅ Lead criado com ID:', createdLead.id);
      
      // Validar IDs antes de inscrever
      if (!createdLead.id || !selectedPipelineId || !addLeadDialog.stageId) {
        console.error('❌ IDs inválidos para inscrição:', {
          leadId: createdLead.id,
          pipelineId: selectedPipelineId,
          stageId: addLeadDialog.stageId
        });
        throw new Error('IDs inválidos para inscrição no pipeline');
      }

      // Inscrever o lead no pipeline com a etapa selecionada
      await inscribePipeline(createdLead.id, selectedPipelineId, addLeadDialog.stageId);
      
      console.log('✅ Lead inscrito no pipeline na etapa:', addLeadDialog.stageName);
      
      // Refetch para atualizar a visualização
      await refetch();
      
      toast({
        title: '✅ Lead criado com sucesso',
        description: `Lead foi criado e adicionado à etapa "${addLeadDialog.stageName}"`
      });
      
      setSuccessAnimation({
        show: true,
        message: `Novo lead criado em "${addLeadDialog.stageName}"`
      });
      
      setAddLeadDialog({ open: false, stageId: '', stageName: '' });
    } catch (error) {
      console.error('❌ Erro ao criar lead:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível criar o lead. Tente novamente.',
        variant: 'destructive'
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
          de: 'updated', 
          para: JSON.stringify(checklistState) 
        }
      ]
    });
  };

  const handleUpdateNote = (note: string) => {
    if (!checklistDialog.entry) return;

    // Log note change
    logChange({
      entidade: 'LeadPipelineEntry',
      entidade_id: checklistDialog.entry.id,
      alteracao: [
        { 
          campo: 'nota_etapa', 
          de: '', 
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

  const handleCreateSimplePipeline = () => {
    setIsNewPipelineDialogOpen(true);
  };

  const handleCreateComplexPipeline = () => {
    setIsPipelineWizardDialogOpen(true);
  };

  const handleSaveNewPipeline = async (pipelineData: any) => {
    await savePipeline(pipelineData);
    setIsNewPipelineDialogOpen(false);
  };

  const handleSaveComplexPipeline = async (complexData: any) => {
    await saveComplexPipeline(complexData);
    setIsPipelineWizardDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header com Seletor de Pipeline */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <PipelineSelector
            pipelines={pipelines as any}
            selectedPipelineId={selectedPipelineId}
            onPipelineChange={propPipelineId ? undefined : setInternalSelectedPipelineId}
            onConfigurePipeline={handleConfigurePipeline}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Pipeline
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem onClick={handleCreateSimplePipeline}>
              <div className="flex flex-col">
                <span className="font-medium">Pipeline Simples</span>
                <span className="text-xs text-muted-foreground">Criação rápida sem etapas</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCreateComplexPipeline}>
              <div className="flex flex-col">
                <span className="font-medium">Pipeline Completo</span>
                <span className="text-xs text-muted-foreground">Com etapas e checklists</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
        checklistItems={checklistItems as any}
        onDragEnd={handleDragEnd}
        onAddLead={handleAddLead}
        onViewLead={handleViewLead}
        onEditLead={handleEditLead}
        onCreateAppointment={handleCreateAppointment}
            onAdvanceStage={handleAdvanceStage}
            onRegisterInteraction={handleRegisterInteraction}
            onOpenChecklist={handleOpenChecklist}
            onRegressStage={handleRegressStage}
            onTransferPipeline={handleTransferPipeline}
      />

        {/* Pipeline Transfer Dialog */}
        <PipelineTransferDialog
          open={transferDialog.open}
          onOpenChange={(open) => setTransferDialog({ open })}
          leadId={transferDialog.leadId || ''}
          leadName={transferDialog.leadName || ''}
          currentPipelineId={transferDialog.currentPipelineId || ''}
          pipelines={pipelines}
          stages={pipelineStages}
          onConfirm={(transfer) => {
            transferPipeline(transfer);
            setTransferDialog({ open: false });
          }}
        />

        {/* Dialogs existentes */}
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
                checklistItems.filter(item => item.etapa_id === checklistDialog.stage!.id)
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

      <EnhancedAppointmentDialog
        open={appointmentDialog.open}
        onOpenChange={(open) => setAppointmentDialog({ open })}
        lead={appointmentDialog.lead!}
        stage={appointmentDialog.stage}
        onSave={async (appointmentData) => {
          try {
            const savedAppointment = await saveAppointment(appointmentData);
            if (savedAppointment) {
              await refetchAppointments();
              refetch(); // Refresh pipeline entries
              toast({
                title: 'Agendamento criado',
                description: `Sessão agendada para ${appointmentDialog.leadName}`,
              });
              setAppointmentDialog({ open: false });
            }
          } catch (error) {
            console.error('Erro ao salvar agendamento:', error);
            toast({
              title: 'Erro ao criar agendamento',
              description: 'Tente novamente em alguns instantes',
              variant: 'destructive'
            });
          }
        }}
      />

      <InteractionDialog
        open={interactionDialog.open}
        onOpenChange={(open) => setInteractionDialog({ open })}
        leadId={interactionDialog.leadId || ''}
        leadName={interactionDialog.leadName || ''}
        onSave={(interaction) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Interação registrada:', interaction);
          }
          toast({
            title: 'Interação registrada',
            description: `Interação registrada para ${interactionDialog.leadName}`,
          });
          setInteractionDialog({ open: false });
        }}
      />

      {/* Dialog para Pipeline Simples */}
      <Dialog open={isNewPipelineDialogOpen} onOpenChange={setIsNewPipelineDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="create-simple-pipeline-description">
          <DialogHeader>
            <DialogTitle>Criar Pipeline Simples</DialogTitle>
            <div id="create-simple-pipeline-description" className="sr-only">
              Formulário para criação rápida de um novo pipeline
            </div>
          </DialogHeader>
          <SimplePipelineForm
            pipeline={null}
            onSave={handleSaveNewPipeline}
            onCancel={() => setIsNewPipelineDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog para Pipeline Completo (Wizard) */}
      <Dialog open={isPipelineWizardDialogOpen} onOpenChange={setIsPipelineWizardDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="create-complex-pipeline-description">
          <DialogHeader>
            <DialogTitle>Criar Pipeline Completo</DialogTitle>
            <div id="create-complex-pipeline-description" className="sr-only">
              Assistente para criação de pipeline com etapas e checklists
            </div>
          </DialogHeader>
          <PipelineWizardForm
            onSave={handleSaveComplexPipeline}
            onCancel={() => setIsPipelineWizardDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      {/* Dialog para adicionar lead em etapa específica */}
      {addLeadDialog.open && (
        <Dialog open={addLeadDialog.open} onOpenChange={(open) => 
          setAddLeadDialog({ open, stageId: '', stageName: '' })
        }>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Lead - {addLeadDialog.stageName}</DialogTitle>
            </DialogHeader>
            <LeadForm
              onSubmit={handleAddLeadSubmit}
              onCancel={() => setAddLeadDialog({ open: false, stageId: '', stageName: '' })}
            />
          </DialogContent>
        </Dialog>
        )}

      {/* Dialog de Edição de Lead */}
      {editLeadDialog.lead && (
        <LeadEditDialog
          open={editLeadDialog.open}
          onOpenChange={(open) => setEditLeadDialog({ open, lead: undefined })}
          lead={editLeadDialog.lead}
          onUpdate={async () => {
            // Refetch both leads and entries to update the UI immediately
            await Promise.all([
              refetchLeads(),
              refetch()
            ]);
          }}
        />
      )}
      
      {/* Success Animation */}
      <SuccessAnimation
        show={successAnimation.show}
        message={successAnimation.message}
        onComplete={() => setSuccessAnimation({ show: false, message: '' })}
      />
    </div>
  );
}