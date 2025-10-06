import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { useSupabaseLeadPipelineEntries } from '@/hooks/useSupabaseLeadPipelineEntries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SimplePipelineForm } from '@/components/forms/SimplePipelineForm';
import { PipelineWizardForm } from '@/components/forms/PipelineWizardForm';
import { 
  GitBranch, 
  Plus, 
  Search, 
  Users, 
  Target,
  Layers,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

export default function PipelineSelection() {
  const navigate = useNavigate();
  const { pipelines, loading, savePipeline, saveComplexPipeline } = useSupabasePipelines();
  const { entries: allEntries } = useSupabaseLeadPipelineEntries();
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewPipelineDialogOpen, setIsNewPipelineDialogOpen] = useState(false);
  const [isPipelineWizardDialogOpen, setIsPipelineWizardDialogOpen] = useState(false);

  // Filtrar pipelines ativos e aplicar busca
  const filteredPipelines = pipelines
    .filter(p => p.ativo)
    .filter(p => 
      searchTerm === '' || 
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Calcular contagens de leads por pipeline
  const leadCountsByPipeline = useMemo(() => {
    const counts: Record<string, number> = {};
    allEntries
      .filter(e => e.status_inscricao === 'Ativo')
      .forEach(entry => {
        counts[entry.pipeline_id] = (counts[entry.pipeline_id] || 0) + 1;
      });
    return counts;
  }, [allEntries]);

  const PipelineCard = ({ 
    pipeline, 
    leadCount 
  }: { 
    pipeline: typeof pipelines[0];
    leadCount: number;
  }) => {

    return (
      <Card 
        className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary/50"
        onClick={() => navigate(`/pipelines/${pipeline.id}`)}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{pipeline.nome}</CardTitle>
            </div>
            {pipeline.primary_pipeline && (
              <Badge variant="default" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Primário
              </Badge>
            )}
          </div>
          {pipeline.descricao && (
            <CardDescription className="line-clamp-2">
              {pipeline.descricao}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{leadCount} leads</span>
            </div>
            {pipeline.objetivo && (
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span className="truncate">{pipeline.objetivo}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Layers className="h-8 w-8 text-primary" />
            Pipelines
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus funis de vendas e processos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsNewPipelineDialogOpen(true)}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Pipeline Simples
          </Button>
          <Button
            onClick={() => setIsPipelineWizardDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Pipeline Completo
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar pipeline..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Pipelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPipelines.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pipelines Primários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredPipelines.filter(p => p.primary_pipeline).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">Ativo</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPipelines.length === 0 ? (
        <Card className="p-12 text-center">
          <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm ? 'Nenhum pipeline encontrado' : 'Nenhum pipeline criado'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm 
              ? 'Tente ajustar sua busca' 
              : 'Crie seu primeiro pipeline para começar'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsPipelineWizardDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Pipeline
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPipelines.map(pipeline => (
            <PipelineCard 
              key={pipeline.id} 
              pipeline={pipeline} 
              leadCount={leadCountsByPipeline[pipeline.id] || 0}
            />
          ))}
        </div>
      )}

      {/* Create Pipeline Dialogs */}
      <Dialog open={isNewPipelineDialogOpen} onOpenChange={setIsNewPipelineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Pipeline Simples</DialogTitle>
          </DialogHeader>
          <SimplePipelineForm
            onSave={async (data) => {
              await savePipeline(data);
              setIsNewPipelineDialogOpen(false);
            }}
            onCancel={() => setIsNewPipelineDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isPipelineWizardDialogOpen} onOpenChange={setIsPipelineWizardDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Pipeline Completo</DialogTitle>
          </DialogHeader>
          <PipelineWizardForm
            onSave={async (data) => {
              await saveComplexPipeline(data);
              setIsPipelineWizardDialogOpen(false);
            }}
            onCancel={() => setIsPipelineWizardDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
