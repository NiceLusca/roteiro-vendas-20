import { useNavigate } from 'react-router-dom';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { useSupabaseLeadPipelineEntries } from '@/hooks/useSupabaseLeadPipelineEntries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnhancedLoading } from '@/components/ui/enhanced-loading';
import { ArrowRight, Target, Layers, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function PipelineSelector() {
  const navigate = useNavigate();
  const { pipelines, loading: pipelinesLoading } = useSupabasePipelines();
  const { entries, loading: entriesLoading } = useSupabaseLeadPipelineEntries();

  const activePipelines = pipelines.filter(p => p.ativo);

  // Se houver apenas 1 pipeline, redirecionar automaticamente
  useEffect(() => {
    if (!pipelinesLoading && activePipelines.length === 1) {
      navigate(`/pipelines/${activePipelines[0].id}`, { replace: true });
    }
  }, [pipelinesLoading, activePipelines, navigate]);

  if (pipelinesLoading || entriesLoading) {
    return <EnhancedLoading loading={true}><></></EnhancedLoading>;
  }

  const getPipelineMetrics = (pipelineId: string) => {
    const pipelineEntries = entries.filter(
      e => e.pipeline_id === pipelineId && e.status_inscricao === 'ativo'
    );
    
    const totalLeads = pipelineEntries.length;
    const leadsAtrasados = pipelineEntries.filter(
      e => e.saude_etapa === 'Vermelho'
    ).length;

    return { totalLeads, leadsAtrasados };
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Selecione um Pipeline
          </h1>
          <p className="text-muted-foreground">
            Escolha o pipeline que deseja visualizar e gerenciar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePipelines.map((pipeline) => {
            const { totalLeads, leadsAtrasados } = getPipelineMetrics(pipeline.id);
            
            return (
              <Card
                key={pipeline.id}
                className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50 cursor-pointer group"
                onClick={() => navigate(`/pipelines/${pipeline.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Layers className="w-6 h-6 text-primary" />
                    </div>
                    {pipeline.primary_pipeline && (
                      <Badge variant="secondary" className="text-xs">
                        Primário
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {pipeline.nome}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {pipeline.descricao}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pipeline.objetivo && (
                    <div className="flex items-start gap-2 text-sm">
                      <Target className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground line-clamp-2">
                        {pipeline.objetivo}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-foreground">
                        {totalLeads}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Leads ativos
                      </p>
                    </div>
                    
                    {leadsAtrasados > 0 && (
                      <div className="flex items-center gap-1 text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {leadsAtrasados} atrasado{leadsAtrasados > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground"
                    variant="outline"
                  >
                    Acessar Pipeline
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {activePipelines.length === 0 && (
          <Card className="p-12 text-center">
            <Layers className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum pipeline encontrado</h3>
            <p className="text-muted-foreground mb-6">
              Crie seu primeiro pipeline para começar a gerenciar leads
            </p>
            <Button onClick={() => navigate('/settings')}>
              Ir para Configurações
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
