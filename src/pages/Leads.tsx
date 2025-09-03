import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LeadForm } from '@/components/forms/LeadForm';
import { PipelineInscriptionDialog } from '@/components/pipeline/PipelineInscriptionDialog';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { useSupabasePipelineStages } from '@/hooks/useSupabasePipelineStages';
import { useSupabaseLeadPipelineEntries } from '@/hooks/useSupabaseLeadPipelineEntries';
import { useMultiPipeline } from '@/hooks/useMultiPipeline';
import { useLeadData } from '@/hooks/useLeadData';
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
  GitBranch
} from 'lucide-react';

export default function Leads() {
  const { leads } = useSupabaseLeads();
  const { pipelines } = useSupabasePipelines();
  const { stages } = useSupabasePipelineStages();
  const { entries } = useSupabaseLeadPipelineEntries();
  const { inscribePipeline, getLeadPipelineEntries } = useMultiPipeline();
  
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterScore, setFilterScore] = useState<string>('all');
  const [showInscriptionDialog, setShowInscriptionDialog] = useState(false);
  const [selectedLeadForInscription, setSelectedLeadForInscription] = useState<Lead | null>(null);
  
  const { saveLead } = useLeadData();

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

  // Filtrar leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.whatsapp.includes(searchTerm);
    
    const matchesStatus = filterStatus === 'all' || lead.status_geral === filterStatus;
    const matchesScore = filterScore === 'all' || lead.lead_score_classification === filterScore;
    
    return matchesSearch && matchesStatus && matchesScore;
  });

  const handleCreateLead = () => {
    setEditingLead(undefined);
    setShowForm(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowForm(true);
  };

  const handleSubmitLead = (leadData: Partial<Lead>) => {
    saveLead(leadData);
    setShowForm(false);
    setEditingLead(undefined);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingLead(undefined);
  };

  const handleInscribeLead = (lead: Lead) => {
    setSelectedLeadForInscription(lead);
    setShowInscriptionDialog(true);
  };

  const handleInscriptionConfirm = async (pipelineId: string, stageId: string) => {
    if (!selectedLeadForInscription) return;
    
    await inscribePipeline(selectedLeadForInscription.id, pipelineId, stageId);
    setShowInscriptionDialog(false);
    setSelectedLeadForInscription(null);
  };

  const getActivePipelineIds = (leadId: string) => {
    return getLeadPipelineEntries(leadId)
      .filter(entry => entry.status_inscricao === 'Ativo')
      .map(entry => entry.pipeline_id);
  };

  const getScoreBadgeClass = (classification: string) => {
    switch (classification) {
      case 'Alto': return 'score-alto';
      case 'Médio': return 'score-medio';
      default: return 'score-baixo';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-primary/10 text-primary border-primary/20';
      case 'Cliente': return 'bg-success/10 text-success border-success/20';
      case 'Perdido': return 'bg-danger/10 text-danger border-danger/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (showForm) {
    return (
      <LeadForm
        lead={editingLead}
        onSubmit={handleSubmitLead}
        onCancel={handleCancelForm}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground">
            Gerencie todos os seus leads e contatos
          </p>
        </div>
        <Button onClick={handleCreateLead} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Lead
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

            <div className="text-sm text-muted-foreground ml-auto">
              {filteredLeads.length} de {leads.length} leads
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Leads */}
      <div className="grid gap-4">
        {filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Nenhum lead encontrado com os filtros aplicados
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Header do Lead */}
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-lg">{lead.nome}</h3>
                      <Badge className={getScoreBadgeClass(lead.lead_score_classification)}>
                        {lead.lead_score} ({lead.lead_score_classification})
                      </Badge>
                      <Badge className={getStatusColor(lead.status_geral)}>
                        {lead.status_geral}
                      </Badge>
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
          ))
        )}
      </div>

      {/* Dialog de Inscrição em Pipeline */}
      {selectedLeadForInscription && (
        <PipelineInscriptionDialog
          open={showInscriptionDialog}
          onOpenChange={setShowInscriptionDialog}
          leadId={selectedLeadForInscription.id}
          leadName={selectedLeadForInscription.nome}
          activePipelineIds={getActivePipelineIds(selectedLeadForInscription.id)}
          pipelines={pipelines.filter(p => p.ativo)}
          stages={stages}
          onConfirm={handleInscriptionConfirm}
        />
      )}
    </div>
  );
}