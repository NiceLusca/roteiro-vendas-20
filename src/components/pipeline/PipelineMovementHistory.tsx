import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  History, 
  Search, 
  Filter, 
  Archive, 
  UserPlus, 
  ArrowRightLeft, 
  MoveRight,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logger } from '@/utils/logger';

type ActivityType = 'archive' | 'inscription' | 'transfer' | 'stage_change';

interface Movement {
  id: string;
  lead_id: string;
  pipeline_entry_id: string | null;
  activity_type: string;
  details: Record<string, any>;
  performed_by: string | null;
  performed_by_name: string | null;
  created_at: string;
  leads?: {
    nome: string;
    email: string | null;
  } | null;
}

interface Pipeline {
  id: string;
  nome: string;
}

interface Stage {
  id: string;
  nome: string;
  pipeline_id: string;
}

const activityTypeConfig: Record<ActivityType, { label: string; icon: React.ReactNode; color: string }> = {
  archive: { 
    label: 'Descadastramento', 
    icon: <Archive className="h-4 w-4" />, 
    color: 'bg-destructive/10 text-destructive border-destructive/20' 
  },
  inscription: { 
    label: 'Inscrição', 
    icon: <UserPlus className="h-4 w-4" />, 
    color: 'bg-green-500/10 text-green-600 border-green-500/20' 
  },
  transfer: { 
    label: 'Transferência', 
    icon: <ArrowRightLeft className="h-4 w-4" />, 
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' 
  },
  stage_change: { 
    label: 'Mudança de Etapa', 
    icon: <MoveRight className="h-4 w-4" />, 
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
  }
};

const periodOptions = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '14', label: 'Últimos 14 dias' },
  { value: '30', label: 'Últimos 30 dias' }
];

export function PipelineMovementHistory() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPipeline, setSelectedPipeline] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30');

  // Fetch pipelines and stages for reference
  useEffect(() => {
    const fetchMetadata = async () => {
      const [pipelinesRes, stagesRes] = await Promise.all([
        supabase.from('pipelines').select('id, nome').eq('ativo', true),
        supabase.from('pipeline_stages').select('id, nome, pipeline_id')
      ]);
      
      if (pipelinesRes.data) setPipelines(pipelinesRes.data);
      if (stagesRes.data) setStages(stagesRes.data);
    };
    
    fetchMetadata();
  }, []);

  // Fetch movements
  const fetchMovements = useCallback(async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('lead_activity_log')
        .select(`
          id,
          lead_id,
          pipeline_entry_id,
          activity_type,
          details,
          performed_by,
          performed_by_name,
          created_at,
          leads!lead_activity_log_lead_id_fkey(nome, email)
        `)
        .in('activity_type', ['archive', 'inscription', 'transfer', 'stage_change'])
        .order('created_at', { ascending: false })
        .limit(200);

      // Filter by type
      if (selectedType !== 'all') {
        query = query.eq('activity_type', selectedType);
      }

      // Filter by period (always max 30 days)
      const daysAgo = Math.min(parseInt(selectedPeriod) || 30, 30);
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - daysAgo);
      query = query.gte('created_at', fromDate.toISOString());

      const { data, error } = await query;

      if (error) {
        logger.error('Erro ao buscar movimentações', error, { feature: 'movement-history' });
        return;
      }

      let filteredData = data || [];

      // Client-side filters
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredData = filteredData.filter(m => 
          m.leads?.nome?.toLowerCase().includes(term) ||
          m.performed_by_name?.toLowerCase().includes(term)
        );
      }

      if (selectedPipeline !== 'all') {
        filteredData = filteredData.filter(m => 
          (m.details as any)?.pipeline_id === selectedPipeline
        );
      }

      setMovements(filteredData as Movement[]);
    } catch (err) {
      logger.error('Erro ao buscar movimentações', err as Error, { feature: 'movement-history' });
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedPipeline, selectedPeriod, searchTerm]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  // Helper functions
  const getPipelineName = (pipelineId: string) => {
    return pipelines.find(p => p.id === pipelineId)?.nome || 'Pipeline desconhecido';
  };

  const getStageName = (stageId: string) => {
    return stages.find(s => s.id === stageId)?.nome || 'Etapa desconhecida';
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM HH:mm", { locale: ptBR });
  };

  const renderMovementDetails = (movement: Movement) => {
    const details = movement.details || {};
    const type = movement.activity_type as ActivityType;

    switch (type) {
      case 'archive':
        return (
          <div className="text-sm text-muted-foreground space-y-1">
            {details.motivo && (
              <p><span className="font-medium">Motivo:</span> {details.motivo}</p>
            )}
            {details.pipeline_id && (
              <p>
                <span className="font-medium">Pipeline:</span> {getPipelineName(details.pipeline_id)}
                {details.etapa_id && ` → ${getStageName(details.etapa_id)}`}
              </p>
            )}
          </div>
        );
      
      case 'inscription':
        return (
          <div className="text-sm text-muted-foreground">
            {details.pipeline_id && (
              <p>
                <span className="font-medium">Pipeline:</span> {getPipelineName(details.pipeline_id)}
                {details.etapa_inicial_id && ` → ${getStageName(details.etapa_inicial_id)}`}
              </p>
            )}
          </div>
        );
      
      case 'transfer':
        return (
          <div className="text-sm text-muted-foreground">
            <p>
              <span className="font-medium">De:</span> {getPipelineName(details.de_pipeline || '')}
              {' → '}
              <span className="font-medium">Para:</span> {getPipelineName(details.para_pipeline || '')}
            </p>
          </div>
        );
      
      case 'stage_change':
        return (
          <div className="text-sm text-muted-foreground">
            <p>
              {getStageName(details.de_etapa || '')} → {getStageName(details.para_etapa || '')}
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card className="card-interactive relative overflow-hidden">
      <div className="card-header-gradient absolute top-0 left-0 right-0" />
      <CardHeader className="pt-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Movimentações
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchMovements}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Buscar
            </Label>
            <Input
              placeholder="Nome do lead ou responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Tipo
            </Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="archive">Descadastramentos</SelectItem>
                <SelectItem value="inscription">Inscrições</SelectItem>
                <SelectItem value="transfer">Transferências</SelectItem>
                <SelectItem value="stage_change">Mudanças de etapa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Pipeline</Label>
            <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os pipelines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os pipelines</SelectItem>
                {pipelines.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Período
            </Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          {movements.length} movimentação(ões) encontrada(s)
        </div>

        {/* Movement list */}
        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mb-4 opacity-50" />
              <p>Nenhuma movimentação encontrada</p>
              <p className="text-sm">Tente ajustar os filtros</p>
            </div>
          ) : (
            <div className="space-y-3">
              {movements.map(movement => {
                const typeConfig = activityTypeConfig[movement.activity_type as ActivityType];
                
                return (
                  <div 
                    key={movement.id}
                    className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant="outline" 
                            className={`flex items-center gap-1 ${typeConfig?.color || ''}`}
                          >
                            {typeConfig?.icon}
                            {typeConfig?.label || movement.activity_type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(movement.created_at)}
                          </span>
                        </div>
                        
                        <p className="font-medium truncate">
                          {movement.leads?.nome || 'Lead desconhecido'}
                        </p>
                        
                        {renderMovementDetails(movement)}
                        
                        {movement.performed_by_name && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Por: <span className="font-medium">{movement.performed_by_name}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
