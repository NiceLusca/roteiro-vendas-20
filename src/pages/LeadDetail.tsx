import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Phone, Mail, MessageSquare, Calendar, DollarSign, FileText, Clock, CheckCircle2, AlertCircle, Plus, GitBranch, Archive, Pencil } from 'lucide-react';
import { 
  mockLeads, 
  mockLeadPipelineEntries, 
  mockPipelineStages, 
  mockPipelines, 
  mockChecklistItems, 
  mockAppointments, 
  mockDeals,
  mockProducts
} from '@/data/mockData';
import { LeadForm } from '@/components/forms/LeadForm';
import { formatWhatsApp, formatCurrency, formatDate } from '@/utils/formatters';
import { Lead, LeadPipelineEntry, PipelineStage, StageChecklistItem, Appointment, Deal, PipelineTransferRequest, Interaction, PipelineEvent, AuditLog } from '@/types/crm';
import { PipelineTransferDialog } from '@/components/pipeline/PipelineTransferDialog';
import { PipelineInscriptionDialog } from '@/components/pipeline/PipelineInscriptionDialog';
import { ChecklistDialog } from '@/components/pipeline/ChecklistDialog';
import { UnifiedTimeline } from '@/components/timeline/UnifiedTimeline';
import { DealLossDialog } from '@/components/deals/DealLossDialog';
import { OrderForm } from '@/components/orders/OrderForm';
import { useAudit } from '@/contexts/AuditContext';
import { useToast } from '@/hooks/use-toast';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  
  // Dialog states
  const [transferDialog, setTransferDialog] = useState<{
    open: boolean;
    entryId?: string;
    pipelineId?: string;
  }>({ open: false });
  
  const [inscriptionDialog, setInscriptionDialog] = useState(false);
  const [checklistDialog, setChecklistDialog] = useState<{
    open: boolean;
    entry?: LeadPipelineEntry & { lead: Lead };
    stage?: PipelineStage;
  }>({ open: false });
  
  const [dealLossDialog, setDealLossDialog] = useState<{
    open: boolean;
    dealId?: string;
  }>({ open: false });
  
  const [showOrderForm, setShowOrderForm] = useState(false);

  const { logChange } = useAudit();
  const { toast } = useToast();

  const lead = mockLeads.find(l => l.id === id);
  const leadEntries = mockLeadPipelineEntries.filter(e => e.lead_id === id && e.status_inscricao === 'Ativo');
  const leadAppointments = mockAppointments.filter(a => a.lead_id === id);
  const leadDeals = mockDeals.filter(d => d.lead_id === id);
  
  // Mock data para timeline (em produção viriam de APIs)
  const mockInteractions: Interaction[] = [];
  const mockPipelineEvents: PipelineEvent[] = [];
  const mockAuditLogs: AuditLog[] = [];

  if (!lead) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Lead não encontrado</h2>
          <Button onClick={() => navigate('/leads')}>Voltar para Leads</Button>
        </div>
      </div>
    );
  }

  const getScoreBadgeClass = (classification: string) => {
    switch (classification) {
      case 'Alto': return 'bg-success text-success-foreground';
      case 'Médio': return 'bg-warning text-warning-foreground';
      case 'Baixo': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getHealthBadgeClass = (health: string) => {
    switch (health) {
      case 'Verde': return 'bg-success text-success-foreground';
      case 'Amarelo': return 'bg-warning text-warning-foreground';
      case 'Vermelho': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const renderTimeline = () => {
    const timelineEvents = [
      ...leadAppointments.map(apt => ({
        id: apt.id,
        type: 'appointment',
        title: `Sessão ${apt.status}`,
        description: apt.resultado_obs || 'Sessão agendada',
        timestamp: apt.start_at,
        icon: Calendar,
        status: apt.status
      })),
      {
        id: 'lead-created',
        type: 'lead',
        title: 'Lead criado',
        description: `Origem: ${lead.origem}`,
        timestamp: lead.created_at,
        icon: FileText,
        status: 'created'
      }
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
      <div className="space-y-4">
        {timelineEvents.map((event) => (
          <div key={event.id} className="flex items-start space-x-3 p-4 rounded-lg border">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <event.icon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{event.title}</p>
              <p className="text-sm text-muted-foreground">{event.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(event.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Event handlers
  const handleTransferPipeline = (transfer: PipelineTransferRequest) => {
    logChange({
      entidade: 'LeadPipelineEntry',
      entidade_id: transfer.leadId,
      alteracao: [
        { campo: 'pipeline_transfer', de: transfer.fromPipelineId, para: transfer.toPipelineId },
        { campo: 'motivo_transferencia', de: '', para: transfer.motivo }
      ]
    });

    toast({
      title: 'Lead transferido',
      description: 'Lead transferido com sucesso para o novo pipeline'
    });
  };

  const handleInscribePipeline = (pipelineId: string, stageId: string) => {
    logChange({
      entidade: 'LeadPipelineEntry',
      entidade_id: `new-entry-${Date.now()}`,
      alteracao: [
        { campo: 'pipeline_inscription', de: '', para: pipelineId },
        { campo: 'initial_stage', de: '', para: stageId }
      ]
    });

    toast({
      title: 'Lead inscrito',
      description: 'Lead inscrito com sucesso no pipeline'
    });
  };

  const handleDealLoss = (dealLoss: { deal_id: string; motivo: string; detalhes?: string }) => {
    logChange({
      entidade: 'Deal',
      entidade_id: dealLoss.deal_id,
      alteracao: [
        { campo: 'status', de: 'Aberta', para: 'Perdida' },
        { campo: 'motivo_perda', de: '', para: dealLoss.motivo }
      ]
    });

    toast({
      title: 'Deal marcada como perdida',
      description: `Motivo registrado: ${dealLoss.motivo}`
    });
  };

  const handleCreateOrder = (order: any, items: any[]) => {
    logChange({
      entidade: 'Order',
      entidade_id: `order-${Date.now()}`,
      alteracao: [
        { campo: 'total', de: 0, para: order.total },
        { campo: 'items_count', de: 0, para: items.length }
      ]
    });

    toast({
      title: 'Pedido criado',
      description: `Pedido de ${formatCurrency(order.total)} criado com sucesso`
    });

    setShowOrderForm(false);
  };

  const renderPipelineSection = () => {
    const activePipelineIds = leadEntries.map(e => e.pipeline_id);
    
    return (
      <div className="space-y-6">
        {/* Header com ações */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pipelines do Lead</h3>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setInscriptionDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Inscrever em Pipeline
            </Button>
          </div>
        </div>

        {leadEntries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground mb-4">Lead não está inscrito em nenhum pipeline</p>
              <Button onClick={() => setInscriptionDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Inscrever em Pipeline
              </Button>
            </CardContent>
          </Card>
        ) : (
          leadEntries.map((entry) => {
            const pipeline = mockPipelines.find(p => p.id === entry.pipeline_id);
            const stage = mockPipelineStages.find(s => s.id === entry.etapa_atual_id);
            const checklistItems = mockChecklistItems.filter(item => item.stage_id === entry.etapa_atual_id);
            
            return (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{pipeline?.nome}</CardTitle>
                      {pipeline?.primary && (
                        <Badge variant="secondary">Primário</Badge>
                      )}
                    </div>
                    <Badge className={getHealthBadgeClass(entry.saude_etapa)}>
                      {entry.saude_etapa}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Etapa: {stage?.nome}</span>
                    <span>•</span>
                    <span>{entry.tempo_em_etapa_dias} dias na etapa</span>
                    {entry.dias_em_atraso > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-destructive">{entry.dias_em_atraso} dias em atraso</span>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {stage && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Próximo Passo:</p>
                        <p className="text-sm text-muted-foreground">{stage.proximo_passo_label}</p>
                      </div>
                      
                      {checklistItems.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Checklist da Etapa:</p>
                          <div className="space-y-2">
                            {checklistItems.map((item) => {
                              const isCompleted = entry.checklist_state[item.id] || false;
                              return (
                                <div key={item.id} className="flex items-center space-x-2">
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4 text-success" />
                                  ) : (
                                    <div className="w-4 h-4 rounded border border-border" />
                                  )}
                                  <span className={`text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                    {item.titulo}
                                    {item.obrigatorio && <span className="text-destructive ml-1">*</span>}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {entry.nota_etapa && (
                        <div>
                          <p className="text-sm font-medium mb-2">Notas da Etapa:</p>
                          <p className="text-sm text-muted-foreground">{entry.nota_etapa}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => setChecklistDialog({
                            open: true,
                            entry: { ...entry, lead } as LeadPipelineEntry & { lead: Lead },
                            stage
                          })}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Gerenciar Etapa
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setTransferDialog({
                            open: true,
                            entryId: entry.id,
                            pipelineId: entry.pipeline_id
                          })}
                        >
                          <GitBranch className="h-4 w-4 mr-2" />
                          Transferir Pipeline
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            logChange({
                              entidade: 'LeadPipelineEntry',
                              entidade_id: entry.id,
                              alteracao: [{ campo: 'status_inscricao', de: 'Ativo', para: 'Arquivado' }]
                            });
                            toast({ title: 'Pipeline arquivado' });
                          }}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Arquivar
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}

        {/* Dialogs */}
        <PipelineTransferDialog
          open={transferDialog.open}
          onOpenChange={(open) => setTransferDialog({ open })}
          leadId={id!}
          leadName={lead?.nome || ''}
          currentPipelineId={transferDialog.pipelineId || ''}
          pipelines={mockPipelines}
          stages={mockPipelineStages}
          onConfirm={handleTransferPipeline}
        />

        <PipelineInscriptionDialog
          open={inscriptionDialog}
          onOpenChange={setInscriptionDialog}
          leadId={id!}
          leadName={lead?.nome || ''}
          activePipelineIds={activePipelineIds}
          pipelines={mockPipelines}
          stages={mockPipelineStages}
          onConfirm={handleInscribePipeline}
        />

        {checklistDialog.entry && checklistDialog.stage && (
          <ChecklistDialog
            open={checklistDialog.open}
            onOpenChange={(open) => setChecklistDialog({ open })}
            entry={checklistDialog.entry}
            stage={checklistDialog.stage}
            checklistItems={mockChecklistItems}
            onUpdateChecklist={(state) => {
              logChange({
                entidade: 'LeadPipelineEntry',
                entidade_id: checklistDialog.entry!.id,
                alteracao: [{ campo: 'checklist_state', de: {}, para: state }]
              });
            }}
            onUpdateNote={(note) => {
              logChange({
                entidade: 'LeadPipelineEntry',
                entidade_id: checklistDialog.entry!.id,
                alteracao: [{ campo: 'nota_etapa', de: '', para: note }]
              });
            }}
            onAdvanceStage={() => {
              toast({ title: 'Etapa avançada com sucesso' });
              setChecklistDialog({ open: false });
            }}
          />
        )}
      </div>
    );
  };

  if (isEditing) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => setIsEditing(false)} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <h1 className="text-2xl font-semibold">Editar Lead</h1>
        </div>
        <LeadForm 
          lead={lead}
          onSubmit={(updatedLead) => {
            // TODO: Implement save logic
            console.log('Lead updated:', updatedLead);
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate('/leads')} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{lead.nome}</h1>
            <p className="text-muted-foreground">#{lead.id}</p>
          </div>
        </div>
        <Button onClick={() => setIsEditing(true)}>
          Editar Lead
        </Button>
      </div>

      {/* Lead Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge className="mt-1">{lead.status_geral}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Score</p>
              <div className="flex items-center mt-1">
                <span className="text-lg font-semibold mr-2">{lead.lead_score}</span>
                <Badge className={getScoreBadgeClass(lead.lead_score_classification)}>
                  {lead.lead_score_classification}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Closer</p>
              <p className="mt-1">{lead.closer || 'Não atribuído'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Origem</p>
              <p className="mt-1">{lead.origem}</p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-sm">{formatWhatsApp(lead.whatsapp)}</span>
            </div>
            {lead.email && (
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-sm">{lead.email}</span>
              </div>
            )}
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-sm">Meta: {formatCurrency(lead.meta_faturamento)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="pipelines" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="deals">Negociações</TabsTrigger>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="notes">Notas</TabsTrigger>
        </TabsList>

        <TabsContent value="pipelines">
          {renderPipelineSection()}
        </TabsContent>

        <TabsContent value="timeline">
          <UnifiedTimeline
            leadId={id!}
            lead={lead}
            appointments={leadAppointments}
            deals={leadDeals}
            interactions={mockInteractions}
            pipelineEvents={mockPipelineEvents}
            auditLogs={mockAuditLogs}
            onAddInteraction={(interaction) => {
              logChange({
                entidade: 'Interaction',
                entidade_id: `interaction-${Date.now()}`,
                alteracao: [
                  { campo: 'canal', de: '', para: interaction.canal },
                  { campo: 'conteudo', de: '', para: interaction.conteudo }
                ]
              });
              toast({ title: 'Interação registrada' });
            }}
          />
        </TabsContent>

        <TabsContent value="agenda">
          <Card>
            <CardHeader>
              <CardTitle>Agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leadAppointments.map((apt) => (
                  <div key={apt.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{formatDate(apt.start_at)}</p>
                        <p className="text-sm text-muted-foreground">Status: {apt.status}</p>
                      </div>
                      <Badge>{apt.status}</Badge>
                    </div>
                    {apt.resultado_obs && (
                      <p className="text-sm text-muted-foreground mt-2">{apt.resultado_obs}</p>
                    )}
                  </div>
                ))}
                {leadAppointments.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Nenhum agendamento encontrado</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deals">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Negociações</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Negociação
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leadDeals.map((deal) => (
                  <div key={deal.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{formatCurrency(deal.valor_proposto)}</p>
                        <p className="text-sm text-muted-foreground">Closer: {deal.closer}</p>
                        {deal.fase_negociacao && (
                          <p className="text-sm text-muted-foreground mt-1">{deal.fase_negociacao}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{deal.status}</Badge>
                        {deal.status === 'Aberta' && (
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setShowOrderForm(true)}
                            >
                              Ganha
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setDealLossDialog({ open: true, dealId: deal.id })}
                            >
                              Perdida
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {leadDeals.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Nenhuma negociação encontrada</p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primera Negociação
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <DealLossDialog
            open={dealLossDialog.open}
            onOpenChange={(open) => setDealLossDialog({ open })}
            dealId={dealLossDialog.dealId || ''}
            onConfirm={handleDealLoss}
          />
        </TabsContent>

        <TabsContent value="sales">
          {showOrderForm ? (
            <OrderForm
              leadId={id!}
              leadName={lead?.nome || ''}
              products={mockProducts}
              onSave={handleCreateOrder}
              onCancel={() => setShowOrderForm(false)}
            />
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pedidos</CardTitle>
                  <Button size="sm" onClick={() => setShowOrderForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Pedido
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Nenhum pedido registrado</p>
                  <Button onClick={() => setShowOrderForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Pedido
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Notas e Observações</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.observacoes ? (
                <div className="prose prose-sm max-w-none">
                  <p>{lead.observacoes}</p>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma nota registrada</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}