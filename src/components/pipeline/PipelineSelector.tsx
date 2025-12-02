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
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4 max-w-full">
      <div className="flex-1 min-w-0">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Pipeline de Vendas</h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
          <Select value={selectedPipelineId} onValueChange={onPipelineChange}>
            <SelectTrigger className="w-full sm:w-48 md:w-56 lg:w-64">
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
            <p className="hidden lg:block text-sm text-muted-foreground truncate">
              {selectedPipeline.descricao}
            </p>
          )}
        </div>
      </div>
      
      <TooltipProvider>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onCreatePipeline} 
                className="flex-1 sm:flex-none h-9 px-3 flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs">Novo</span>
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
                className="flex-1 sm:flex-none h-9 px-3 flex items-center justify-center gap-2"
              >
                <Settings className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs">Configurar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Configurar Pipeline</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}