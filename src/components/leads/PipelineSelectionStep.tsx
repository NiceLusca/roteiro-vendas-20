import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { useSupabasePipelineStages } from '@/hooks/useSupabasePipelineStages';
import { ArrowRight, ArrowLeft, GitBranch, Plus, X } from 'lucide-react';

interface PipelineSelectionStepProps {
  onComplete: (pipelines: Array<{ pipelineId: string; stageId: string }>) => void;
  onBack: () => void;
}

export function PipelineSelectionStep({ onComplete, onBack }: PipelineSelectionStepProps) {
  const { pipelines } = useSupabasePipelines();
  const { stages } = useSupabasePipelineStages();
  const [selectedPipelines, setSelectedPipelines] = useState<Array<{ pipelineId: string; stageId: string }>>([]);
  const [currentPipeline, setCurrentPipeline] = useState<string>('');
  const [currentStage, setCurrentStage] = useState<string>('');

  const activePipelines = pipelines.filter(p => p.ativo);
  const currentPipelineStages = currentPipeline
    ? stages.filter(s => s.pipeline_id === currentPipeline).sort((a, b) => a.ordem - b.ordem)
    : [];

  const handleAddPipeline = () => {
    if (!currentPipeline || !currentStage) return;

    // Verificar se já não foi adicionado
    if (selectedPipelines.some(p => p.pipelineId === currentPipeline)) {
      return;
    }

    setSelectedPipelines(prev => [
      ...prev,
      { pipelineId: currentPipeline, stageId: currentStage }
    ]);
    setCurrentPipeline('');
    setCurrentStage('');
  };

  const handleRemovePipeline = (pipelineId: string) => {
    setSelectedPipelines(prev => prev.filter(p => p.pipelineId !== pipelineId));
  };

  const handleContinue = () => {
    onComplete(selectedPipelines);
  };

  const getPipelineName = (pipelineId: string) => {
    return pipelines.find(p => p.id === pipelineId)?.nome || '';
  };

  const getStageName = (stageId: string) => {
    return stages.find(s => s.id === stageId)?.nome || '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Inscrever em Pipelines</h3>
        <p className="text-sm text-muted-foreground">
          Selecione em quais pipelines os leads serão automaticamente inscritos (opcional)
        </p>
      </div>

      {/* Adicionar pipeline */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Plus className="h-4 w-4" />
          <span className="font-medium text-sm">Adicionar Pipeline</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Pipeline</label>
            <Select value={currentPipeline} onValueChange={(value) => {
              setCurrentPipeline(value);
              setCurrentStage('');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um pipeline" />
              </SelectTrigger>
              <SelectContent>
                {activePipelines.map((pipeline) => (
                  <SelectItem
                    key={pipeline.id}
                    value={pipeline.id}
                    disabled={selectedPipelines.some(p => p.pipelineId === pipeline.id)}
                  >
                    {pipeline.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Etapa Inicial</label>
            <Select
              value={currentStage}
              onValueChange={setCurrentStage}
              disabled={!currentPipeline}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma etapa" />
              </SelectTrigger>
              <SelectContent>
                {currentPipelineStages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleAddPipeline}
          disabled={!currentPipeline || !currentStage}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Pipeline
        </Button>
      </div>

      {/* Pipelines selecionados */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="h-4 w-4" />
          <span className="font-medium text-sm">Pipelines Selecionados</span>
          {selectedPipelines.length > 0 && (
            <Badge variant="secondary">{selectedPipelines.length}</Badge>
          )}
        </div>

        {selectedPipelines.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pipeline selecionado</p>
        ) : (
          <div className="space-y-2">
            {selectedPipelines.map((selected) => (
              <div
                key={selected.pipelineId}
                className="flex items-center justify-between p-3 bg-accent/50 rounded-lg"
              >
                <div>
                  <div className="font-medium text-sm">
                    {getPipelineName(selected.pipelineId)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Etapa inicial: {getStageName(selected.stageId)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemovePipeline(selected.pipelineId)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={handleContinue}>
          Continuar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
