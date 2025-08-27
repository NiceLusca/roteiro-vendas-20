import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Phone, Mail, MessageSquare, Calendar, DollarSign, FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { mockLeads, mockLeadPipelineEntries, mockPipelineStages, mockPipeline, mockChecklistItems, mockAppointments, mockDeals } from '@/data/mockData';
import { LeadForm } from '@/components/forms/LeadForm';
import { formatWhatsApp, formatCurrency, formatDate } from '@/utils/formatters';
import { Lead, LeadPipelineEntry, PipelineStage, StageChecklistItem, Appointment, Deal } from '@/types/crm';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const lead = mockLeads.find(l => l.id === id);
  const leadEntries = mockLeadPipelineEntries.filter(e => e.lead_id === id && e.status_inscricao === 'Ativo');
  const leadAppointments = mockAppointments.filter(a => a.lead_id === id);
  const leadDeals = mockDeals.filter(d => d.lead_id === id);

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

  const renderPipelineSection = () => {
    return (
      <div className="space-y-6">
        {leadEntries.map((entry) => {
          const stage = mockPipelineStages.find(s => s.id === entry.etapa_atual_id);
          const checklistItems = mockChecklistItems.filter(item => item.stage_id === entry.etapa_atual_id);
          
          return (
            <Card key={entry.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{mockPipeline.nome}</CardTitle>
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

                    <div className="flex space-x-2">
                      <Button size="sm">Avançar Etapa</Button>
                      <Button size="sm" variant="outline">Transferir Pipeline</Button>
                      <Button size="sm" variant="outline">Registrar Interação</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
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
          onSave={() => {
            setIsEditing(false);
            // TODO: Implement save logic
          }}
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
          <Card>
            <CardHeader>
              <CardTitle>Timeline de Atividades</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTimeline()}
            </CardContent>
          </Card>
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
              <CardTitle>Negociações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leadDeals.map((deal) => (
                  <div key={deal.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{formatCurrency(deal.valor_proposto)}</p>
                        <p className="text-sm text-muted-foreground">Closer: {deal.closer}</p>
                      </div>
                      <Badge>{deal.status}</Badge>
                    </div>
                    {deal.fase_negociacao && (
                      <p className="text-sm text-muted-foreground mt-2">{deal.fase_negociacao}</p>
                    )}
                  </div>
                ))}
                {leadDeals.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Nenhuma negociação encontrada</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">Nenhuma venda registrada</p>
            </CardContent>
          </Card>
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