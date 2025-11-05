import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { KanbanColumn } from './KanbanColumn';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { 
  Filter, 
  Search, 
  Settings, 
  RotateCcw,
  Users,
  TrendingUp
} from 'lucide-react';

export function PipelineKanban() {
  const { pipelines } = useSupabasePipelines();
  const { leads } = useSupabaseLeads();
  
  const [selectedPipeline] = useState(pipelines[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCloser, setFilterCloser] = useState<string>('all');
  const [filterScore, setFilterScore] = useState<string>('all');
  const [filterHealth, setFilterHealth] = useState<string>('all');

  // Use actual data instead of mock
  const mockPipelineStages: any[] = [];
  const mockLeadPipelineEntries: any[] = [];
  const mockPipeline = pipelines[0] || { nome: 'Pipeline Principal', descricao: 'Pipeline padrão' };

  // Buscar stages ordenadas
  const stages = mockPipelineStages
    .filter(stage => stage.pipeline_id === selectedPipeline)
    .sort((a, b) => a.ordem - b.ordem);

  // Buscar entries ativas e aplicar filtros
  const allEntries = mockLeadPipelineEntries
    .filter(entry => entry.status_inscricao === 'Ativo')
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
  const stageEntries = stages.map(stage => {
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

  const handleViewLead = (leadId: string) => {
    // Navigate to lead details - handled by parent component
    window.location.href = `/leads/${leadId}`;
  };

  const handleCreateAppointment = (leadId: string) => {
    // Placeholder for appointment creation
    // This should be handled by parent component
  };

  const handleAdvanceStage = (entryId: string) => {
    // Placeholder for stage advancement
    // This should be handled by parent component
  };

  const handleRegisterInteraction = (leadId: string) => {
    // Placeholder for interaction registration
    // This should be handled by parent component
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCloser('all');
    setFilterScore('all');
    setFilterHealth('all');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header Fixo */}
      <div className="flex-none space-y-4 pb-4 border-b bg-background">
        {/* Título e Botões */}
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
      </div>

      {/* Área de Scroll APENAS para o Kanban */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pt-6">
        <div className="flex gap-2 md:gap-3 lg:gap-4 pb-6 h-full scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
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
    </div>
  );
}