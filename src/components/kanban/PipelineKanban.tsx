import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { KanbanColumn } from './KanbanColumn';
import { 
  mockPipeline, 
  mockPipelineStages, 
  mockLeadPipelineEntries, 
  mockLeads 
} from '@/data/mockData';
import { 
  Filter, 
  Search, 
  Settings, 
  RotateCcw,
  Users,
  TrendingUp
} from 'lucide-react';

export function PipelineKanban() {
  const [selectedPipeline] = useState(mockPipeline.id);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCloser, setFilterCloser] = useState<string>('all');
  const [filterScore, setFilterScore] = useState<string>('all');
  const [filterHealth, setFilterHealth] = useState<string>('all');

  // Buscar stages ordenadas
  const stages = mockPipelineStages
    .filter(stage => stage.pipeline_id === selectedPipeline)
    .sort((a, b) => a.ordem - b.ordem);

  // Buscar entries ativas e aplicar filtros
  const allEntries = mockLeadPipelineEntries
    .filter(entry => entry.status_inscricao === 'Ativo')
    .map(entry => {
      const lead = mockLeads.find(l => l.id === entry.lead_id);
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
  const stageEntries = stages.map(stage => {
    const entries = allEntries.filter(entry => entry?.etapa_atual_id === stage.id);
    const wipExceeded = stage.wip_limit ? entries.length > stage.wip_limit : false;
    
    return {
      stage,
      entries: entries as Array<typeof allEntries[0] & { lead: typeof mockLeads[0] }>,
      wipExceeded
    };
  });

  // Obter closers únicos
  const closers = Array.from(new Set(mockLeads.map(l => l.closer).filter(Boolean)));

  // Métricas do pipeline
  const totalLeads = allEntries.length;
  const leadsAtrasados = allEntries.filter(e => e && e.dias_em_atraso > 0).length;
  const tempoMedioEtapa = totalLeads > 0 
    ? Math.round(allEntries.reduce((acc, e) => acc + (e?.tempo_em_etapa_dias || 0), 0) / totalLeads)
    : 0;

  const handleViewLead = (leadId: string) => {
    console.log('Ver lead:', leadId);
    // TODO: Navegar para detalhes do lead
  };

  const handleCreateAppointment = (leadId: string) => {
    console.log('Criar agendamento para lead:', leadId);
    // TODO: Abrir modal de agendamento
  };

  const handleAdvanceStage = (entryId: string) => {
    console.log('Avançar etapa:', entryId);
    // TODO: Lógica de avanço de etapa
  };

  const handleRegisterInteraction = (leadId: string) => {
    console.log('Registrar interação:', leadId);
    // TODO: Abrir modal de interação
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCloser('all');
    setFilterScore('all');
    setFilterHealth('all');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pipeline de Vendas</h1>
          <p className="text-muted-foreground">
            {mockPipeline.nome} - {mockPipeline.descricao}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
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
                {closers.map(closer => (
                  <SelectItem key={closer} value={closer!}>
                    {closer}
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

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-6">
        {stageEntries.map(({ stage, entries, wipExceeded }) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            entries={entries}
            wipExceeded={wipExceeded}
            onViewLead={handleViewLead}
            onCreateAppointment={handleCreateAppointment}
            onAdvanceStage={handleAdvanceStage}
            onRegisterInteraction={handleRegisterInteraction}
          />
        ))}
      </div>
    </div>
  );
}