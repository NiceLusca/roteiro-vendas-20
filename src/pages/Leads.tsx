import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LeadForm } from '@/components/forms/LeadForm';
import { PipelineInscriptionDialog } from '@/components/pipeline/PipelineInscriptionDialog';
import { LeadBulkUploadDialog } from '@/components/leads/LeadBulkUploadDialog';
import { BulkActionsMenu } from '@/components/leads/BulkActionsMenu';
import { BulkTaggingDialog } from '@/components/leads/BulkTaggingDialog';
import { BulkDeleteDialog } from '@/components/leads/BulkDeleteDialog';
import { BulkPipelineInscriptionDialog } from '@/components/leads/BulkPipelineInscriptionDialog';
import { BulkScoreAdjustmentDialog } from '@/components/leads/BulkScoreAdjustmentDialog';
import { GlobalErrorBoundary } from '@/components/ui/GlobalErrorBoundary';
import { SkeletonLeadsList } from '@/components/ui/skeleton-card';
import { useOptimizedLeads } from '@/hooks/useOptimizedLeads';
import { useLeadTags } from '@/hooks/useLeadTags';
import { useBulkLeadActions } from '@/hooks/useBulkLeadActions';
import { useToast } from '@/hooks/use-toast';
import { CRMProviderWrapper } from '@/contexts/CRMProviderWrapper';
import { Lead } from '@/types/crm';
import { formatWhatsApp, formatDateTime } from '@/utils/formatters';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Phone, 
  Mail,
  MessageCircle,
  TrendingUp,
  GitBranch,
  Loader2,
  Upload
} from 'lucide-react';

function LeadsContent() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterScore, setFilterScore] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showInscriptionDialog, setShowInscriptionDialog] = useState(false);
  const [selectedLeadForInscription, setSelectedLeadForInscription] = useState<Lead | null>(null);
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [showBulkTagDialog, setShowBulkTagDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkPipelineDialog, setShowBulkPipelineDialog] = useState(false);
  const [showBulkScoreDialog, setShowBulkScoreDialog] = useState(false);
  const [filteredLeadIds, setFilteredLeadIds] = useState<string[]>([]);
  const [previewLeads, setPreviewLeads] = useState<Lead[]>([]);
  
  // Lazy load pipelines and stages only when needed
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [loadingPipelines, setLoadingPipelines] = useState(false);
  const [pipelineEntries, setPipelineEntries] = useState<any[]>([]);
  
  // Use optimized hook with React Query
  const { 
    leads, 
    totalCount,
    totalPages,
    isLoading: leadsLoading, 
    saveLead, 
    savingLead,
    refetch
  } = useOptimizedLeads({
    page: currentPage,
    searchTerm,
    filterStatus,
    filterScore,
    filterTag
  });

  const { updateLeadTags } = useLeadTags();

  // Bulk actions hook
  const {
    getFilteredLeadIds,
    addTagsToLeads,
    removeTagsFromLeads,
    replaceTagsOnLeads,
    deleteLeads,
    bulkInscribePipeline,
    bulkAdjustScore,
    isLoading: bulkActionsLoading,
    progress: bulkActionsProgress
  } = useBulkLeadActions();

  // Load tags for filter
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  
  useEffect(() => {
    const loadTags = async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase
        .from('lead_tags')
        .select('id, nome, cor')
        .order('nome');
      setAvailableTags(data || []);
    };
    loadTags();
  }, []);

  // Listen for global create lead event
  useEffect(() => {
    const handleOpenCreateLeadDialog = () => {
      handleCreateLead();
    };

    window.addEventListener('open-create-lead-dialog', handleOpenCreateLeadDialog);
    
    return () => {
      window.removeEventListener('open-create-lead-dialog', handleOpenCreateLeadDialog);
    };
  }, []);

  // Memoize filtered leads to prevent unnecessary re-renders
  const filteredLeads = useMemo(() => leads, [leads]);

  // Memoized handlers to prevent re-renders
  const handleCreateLead = useCallback(() => {
    setEditingLead(undefined);
    setShowForm(true);
  }, []);

  const handleEditLead = useCallback((lead: Lead) => {
    setEditingLead(lead);
    setShowForm(true);
  }, []);

  const handleSubmitLead = useCallback(async (leadData: Partial<Lead>, selectedTagIds?: string[]) => {
    saveLead(leadData);
    
    // Update tags if provided and we have a lead ID
    if (selectedTagIds !== undefined) {
      const leadId = leadData.id;
      if (leadId) {
        await updateLeadTags(leadId, selectedTagIds);
      }
    }
    
    setShowForm(false);
    setEditingLead(undefined);
    
    // Wait a bit to ensure save is complete before refetching
    setTimeout(() => {
      refetch();
    }, 500);
  }, [saveLead, updateLeadTags, refetch]);

  const handleCancelForm = useCallback(() => {
    setShowForm(false);
    setEditingLead(undefined);
  }, []);

  const handleInscribeLead = useCallback(async (lead: Lead) => {
    setSelectedLeadForInscription(lead);
    
    // Lazy load pipelines and stages only when inscription dialog opens
    if (pipelines.length === 0 && !loadingPipelines) {
      setLoadingPipelines(true);
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        
        // Load pipelines
        const { data: pipelinesData } = await supabase
          .from('pipelines')
          .select('id, nome, ativo')
          .eq('ativo', true)
          .order('created_at', { ascending: false });
        
        // Load stages
        const { data: stagesData } = await supabase
          .from('pipeline_stages')
          .select('id, pipeline_id, nome, ordem')
          .order('ordem');
        
        // Load pipeline entries for this lead
        const { data: entriesData } = await supabase
          .from('lead_pipeline_entries')
          .select('id, pipeline_id, lead_id, status_inscricao')
          .eq('lead_id', lead.id)
          .eq('status_inscricao', 'Ativo');
        
        setPipelines(pipelinesData || []);
        setStages(stagesData || []);
        setPipelineEntries(entriesData || []);
      } catch (error) {
        console.error('Error loading pipelines:', error);
      } finally {
        setLoadingPipelines(false);
      }
    }
    
    setShowInscriptionDialog(true);
  }, [pipelines.length, loadingPipelines]);

  const handleInscriptionConfirm = async (pipelineId: string, stageId: string) => {
    if (!selectedLeadForInscription) return;
    
    try {
      const { useCRM } = await import('@/contexts/CRMContext');
      const { inscribeLeadToPipeline } = useCRM();
      
      const success = await inscribeLeadToPipeline(
        selectedLeadForInscription.id,
        pipelineId,
        stageId
      );
      
      if (success) {
        setShowInscriptionDialog(false);
        setSelectedLeadForInscription(null);
        await refetch();
      }
    } catch (error) {
      console.error('Error in handleInscriptionConfirm:', error);
      toast({
        title: 'Erro ao inscrever lead',
        description: 'Ocorreu um erro ao inscrever o lead no pipeline',
        variant: 'destructive'
      });
    }
  };

  const getActivePipelineIds = async (leadId: string) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase
        .from('lead_pipeline_entries')
        .select('pipeline_id')
        .eq('lead_id', leadId)
        .eq('status_inscricao', 'Ativo');
      
      return data?.map(entry => entry.pipeline_id) || [];
    } catch (error) {
      console.error('Error fetching active pipelines:', error);
      return [];
    }
  };

  // Bulk actions handlers
  const handleOpenBulkTagDialog = useCallback(async () => {
    try {
      const ids = await getFilteredLeadIds({
        searchTerm,
        filterStatus,
        filterScore,
        filterTag
      });
      setFilteredLeadIds(ids);
      setPreviewLeads(leads.slice(0, 10));
      setShowBulkTagDialog(true);
    } catch (error) {
      console.error('Error getting filtered leads:', error);
    }
  }, [searchTerm, filterStatus, filterScore, filterTag, leads, getFilteredLeadIds]);

  const handleOpenBulkDeleteDialog = useCallback(async () => {
    try {
      const ids = await getFilteredLeadIds({
        searchTerm,
        filterStatus,
        filterScore,
        filterTag
      });
      setFilteredLeadIds(ids);
      setPreviewLeads(leads.slice(0, 10));
      setShowBulkDeleteDialog(true);
    } catch (error) {
      console.error('Error getting filtered leads:', error);
    }
  }, [searchTerm, filterStatus, filterScore, filterTag, leads, getFilteredLeadIds]);

  const handleBulkAddTags = useCallback(async (tagIds: string[]) => {
    await addTagsToLeads(filteredLeadIds, tagIds);
    await refetch();
  }, [filteredLeadIds, addTagsToLeads, refetch]);

  const handleBulkRemoveTags = useCallback(async (tagIds: string[]) => {
    await removeTagsFromLeads(filteredLeadIds, tagIds);
    await refetch();
  }, [filteredLeadIds, removeTagsFromLeads, refetch]);

  const handleBulkReplaceTags = useCallback(async (tagIds: string[]) => {
    await replaceTagsOnLeads(filteredLeadIds, tagIds);
    await refetch();
  }, [filteredLeadIds, replaceTagsOnLeads, refetch]);

  const handleBulkDelete = useCallback(async () => {
    await deleteLeads(filteredLeadIds);
    await refetch();
  }, [filteredLeadIds, deleteLeads, refetch]);

  const handleOpenBulkPipelineDialog = useCallback(async () => {
    try {
      const ids = await getFilteredLeadIds({
        searchTerm,
        filterStatus,
        filterScore,
        filterTag
      });
      setFilteredLeadIds(ids);
      setPreviewLeads(leads.slice(0, 10));
      setShowBulkPipelineDialog(true);
    } catch (error) {
      console.error('Error getting filtered leads:', error);
    }
  }, [searchTerm, filterStatus, filterScore, filterTag, leads, getFilteredLeadIds]);

  const handleOpenBulkScoreDialog = useCallback(async () => {
    try {
      const ids = await getFilteredLeadIds({
        searchTerm,
        filterStatus,
        filterScore,
        filterTag
      });
      setFilteredLeadIds(ids);
      setShowBulkScoreDialog(true);
    } catch (error) {
      console.error('Error getting filtered leads:', error);
    }
  }, [searchTerm, filterStatus, filterScore, filterTag, getFilteredLeadIds]);

  const handleBulkInscribePipeline = useCallback(async (pipelineId: string, stageId: string, skipExisting: boolean) => {
    await bulkInscribePipeline(filteredLeadIds, pipelineId, stageId, skipExisting);
    setShowBulkPipelineDialog(false);
    await refetch();
  }, [filteredLeadIds, bulkInscribePipeline, refetch]);

  const handleBulkAdjustScore = useCallback(async (scoreAdjustment: number, mode: 'add' | 'set') => {
    await bulkAdjustScore(filteredLeadIds, scoreAdjustment, mode);
    setShowBulkScoreDialog(false);
    await refetch();
  }, [filteredLeadIds, bulkAdjustScore, refetch]);

  // Memoized style functions
  const getScoreBadgeClass = useCallback((classification: string) => {
    switch (classification) {
      case 'Alto': return 'score-alto';
      case 'Médio': return 'score-medio';
      default: return 'score-baixo';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-primary/10 text-primary border-primary/20';
      case 'Cliente': return 'bg-success/10 text-success border-success/20';
      case 'Perdido': return 'bg-danger/10 text-danger border-danger/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  }, []);

  if (showForm) {
    return (
      <GlobalErrorBoundary>
        <LeadForm
          lead={editingLead}
          onSubmit={handleSubmitLead}
          onCancel={handleCancelForm}
          loading={savingLead}
        />
      </GlobalErrorBoundary>
    );
  }

  if (leadsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Leads</h1>
            <p className="text-muted-foreground">Carregando leads...</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled className="gap-2">
              <Upload className="h-4 w-4" />
              Importar Planilha
            </Button>
            <Button disabled className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Lead
            </Button>
          </div>
        </div>
        
        {/* Skeleton loading */}
        <SkeletonLeadsList count={5} />
      </div>
    );
  }

  return (
    <GlobalErrorBoundary>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground">
            Gerencie todos os seus leads e contatos
          </p>
        </div>
        <div className="flex gap-2">
          <BulkActionsMenu
            leadCount={totalCount}
            onTagAction={handleOpenBulkTagDialog}
            onPipelineAction={handleOpenBulkPipelineDialog}
            onScoreAction={handleOpenBulkScoreDialog}
            onDeleteAction={handleOpenBulkDeleteDialog}
            disabled={bulkActionsLoading}
          />
          <Button variant="outline" onClick={() => setShowBulkUploadDialog(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Importar Planilha
          </Button>
          <Button onClick={handleCreateLead} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Lead
          </Button>
        </div>
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
                placeholder="Buscar por nome, email ou WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Filtro Status */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Cliente">Cliente</SelectItem>
                <SelectItem value="Perdido">Perdido</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
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

            {/* Filtro Tag */}
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as tags</SelectItem>
                {availableTags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: tag.cor }}
                      />
                      {tag.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground ml-auto">
              Mostrando {filteredLeads.length} de {totalCount} leads
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Leads */}
      <div className="space-y-4">
        {filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Nenhum lead encontrado com os filtros aplicados
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Header do Lead */}
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h3 className="font-semibold text-lg">{lead.nome}</h3>
                        <Badge className={getScoreBadgeClass(lead.lead_score_classification)}>
                          {lead.lead_score} ({lead.lead_score_classification})
                        </Badge>
                        <Badge className={getStatusColor(lead.status_geral)}>
                          {lead.status_geral}
                        </Badge>
                        {/* Tags do Lead */}
                        {(lead as any).tags?.map((tag: any) => (
                          <Badge 
                            key={tag.id} 
                            variant="outline"
                            className="gap-1"
                            style={{ 
                              borderColor: tag.cor,
                              color: tag.cor
                            }}
                          >
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: tag.cor }}
                            />
                            {tag.nome}
                          </Badge>
                        ))}
                      </div>

                      {/* Informações do Lead */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{formatWhatsApp(lead.whatsapp)}</span>
                        </div>
                        
                        {lead.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          <span>{lead.origem} • {lead.segmento}</span>
                        </div>
                      </div>

                      {/* Detalhes adicionais */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {lead.closer && (
                          <span>Closer: {lead.closer}</span>
                        )}
                        <span>Criado: {formatDateTime(lead.created_at)}</span>
                        {lead.objecao_principal && (
                          <Badge variant="outline" className="text-xs">
                            Objeção: {lead.objecao_principal}
                          </Badge>
                        )}
                      </div>

                      {/* Desejo na sessão */}
                      {lead.desejo_na_sessao && (
                        <div className="mt-3 p-3 bg-accent/50 rounded-md">
                          <p className="text-sm text-foreground">
                            <strong>Desejo:</strong> {lead.desejo_na_sessao}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditLead(lead)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleInscribeLead(lead)}>
                        <GitBranch className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || leadsLoading}
            >
              Anterior
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={leadsLoading}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || leadsLoading}
            >
              Próxima
            </Button>
            
            <span className="text-sm text-muted-foreground ml-4">
              Página {currentPage} de {totalPages}
            </span>
          </div>
        )}
      </div>

      {/* Dialog de Inscrição em Pipeline */}
      {selectedLeadForInscription && showInscriptionDialog && (
        <PipelineInscriptionDialog
          open={showInscriptionDialog}
          onOpenChange={setShowInscriptionDialog}
          leadId={selectedLeadForInscription.id}
          leadName={selectedLeadForInscription.nome}
          activePipelineIds={pipelineEntries.map(e => e.pipeline_id)}
          pipelines={pipelines}
          stages={stages}
          onConfirm={handleInscriptionConfirm}
        />
      )}

      {/* Dialog de Upload em Massa */}
      <LeadBulkUploadDialog
        open={showBulkUploadDialog}
        onOpenChange={setShowBulkUploadDialog}
        onSuccess={() => {
          // Refetch leads após importação
          refetch();
          setCurrentPage(1);
        }}
      />

      {/* Dialog de Tagueamento em Massa */}
      <BulkTaggingDialog
        open={showBulkTagDialog}
        onOpenChange={setShowBulkTagDialog}
        leadCount={filteredLeadIds.length}
        availableTags={availableTags}
        onAddTags={handleBulkAddTags}
        onRemoveTags={handleBulkRemoveTags}
        onReplaceTags={handleBulkReplaceTags}
        isLoading={bulkActionsLoading}
        progress={bulkActionsProgress}
      />

      {/* Dialog de Exclusão em Massa */}
      <BulkDeleteDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        leadCount={filteredLeadIds.length}
        previewLeads={previewLeads}
        onConfirmDelete={handleBulkDelete}
        isLoading={bulkActionsLoading}
        progress={bulkActionsProgress}
      />

      {/* Dialog de Inscrição em Pipeline em Massa */}
      <BulkPipelineInscriptionDialog
        open={showBulkPipelineDialog}
        onOpenChange={setShowBulkPipelineDialog}
        leadIds={filteredLeadIds}
        previewLeads={previewLeads}
        onConfirm={handleBulkInscribePipeline}
        isLoading={bulkActionsLoading}
        progress={bulkActionsProgress}
      />

      {/* Dialog de Ajuste de Score em Massa */}
      <BulkScoreAdjustmentDialog
        open={showBulkScoreDialog}
        onOpenChange={setShowBulkScoreDialog}
        leadIds={filteredLeadIds}
        onConfirm={handleBulkAdjustScore}
        isLoading={bulkActionsLoading}
        progress={bulkActionsProgress}
      />
    </div>
    </GlobalErrorBoundary>
  );
}

export default function Leads() {
  return (
    <CRMProviderWrapper>
      <LeadsContent />
    </CRMProviderWrapper>
  );
}