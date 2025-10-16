import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pipeline } from '@/types/crm';
import { Settings, Plus } from 'lucide-react';

interface PipelineSelectorProps {
  pipelines: Pipeline[];
  selectedPipelineId: string;
  onPipelineChange: (pipelineId: string) => void;
  onConfigurePipeline?: () => void;
  onCreatePipeline?: () => void;
}

export function PipelineSelector({
  pipelines,
  selectedPipelineId,
  onPipelineChange,
  onConfigurePipeline,
  onCreatePipeline
}: PipelineSelectorProps) {
  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);

  return (
    <div className="flex items-start justify-between gap-4 max-w-full">
      <div className="flex-1 min-w-0 overflow-hidden">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Pipeline de Vendas</h1>
          <div className="flex items-center gap-2 mt-1">
            <Select value={selectedPipelineId} onValueChange={onPipelineChange}>
              <SelectTrigger className="w-48 md:w-56 lg:w-64">
                <SelectValue placeholder="Selecionar pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map(pipeline => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    <div className="flex items-center gap-2">
                      <span>{pipeline.nome}</span>
                      {pipeline.primary_pipeline && (
                        <Badge variant="secondary" className="text-xs">
                          Primário
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPipeline && (
              <p className="hidden lg:block text-sm text-muted-foreground">
                {selectedPipeline.descricao}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <TooltipProvider>
        <div className="flex-shrink-0 flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onCreatePipeline} 
                className="h-8 w-8 p-0 flex items-center justify-center 2xl:w-auto 2xl:px-2 2xl:gap-1 whitespace-nowrap"
              >
                <Plus className="h-4 w-4 flex-shrink-0" />
                <span className="hidden 2xl:inline text-xs">Novo Pipeline</span>
                <span className="2xl:hidden sr-only">Novo Pipeline</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Novo Pipeline</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onConfigurePipeline} 
                className="h-8 w-8 p-0 flex items-center justify-center 2xl:w-auto 2xl:px-2 2xl:gap-1 whitespace-nowrap"
              >
                <Settings className="h-4 w-4 flex-shrink-0" />
                <span className="hidden 2xl:inline text-xs">Configurar</span>
                <span className="2xl:hidden sr-only">Configurar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Configurar Pipeline</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}