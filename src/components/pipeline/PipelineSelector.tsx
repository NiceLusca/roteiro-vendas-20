import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pipeline } from '@/types/crm';
import { Settings, Plus, Eye, Pencil, Lock } from 'lucide-react';

interface PipelineSelectorProps {
  pipelines: Pipeline[];
  selectedPipelineId: string;
  onPipelineChange: (pipelineId: string) => void;
  onConfigurePipeline?: () => void;
  onCreatePipeline?: () => void;
  canManage?: boolean; // Can configure pipelines
  accessLevel?: 'none' | 'view' | 'edit' | 'manage' | 'admin';
}

const accessLevelBadge = {
  view: { label: 'Visualização', icon: Eye, variant: 'outline' as const },
  edit: { label: 'Edição', icon: Pencil, variant: 'secondary' as const },
  manage: { label: 'Gerenciamento', icon: Settings, variant: 'default' as const },
  admin: { label: 'Admin', icon: Lock, variant: 'destructive' as const },
  none: { label: '', icon: null, variant: 'outline' as const },
};

export function PipelineSelector({
  pipelines,
  selectedPipelineId,
  onPipelineChange,
  onConfigurePipeline,
  onCreatePipeline,
  canManage = true,
  accessLevel = 'admin'
}: PipelineSelectorProps) {
  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);
  const showAccessBadge = accessLevel !== 'admin' && accessLevel !== 'none';
  const accessInfo = accessLevelBadge[accessLevel];

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4 max-w-full">
      <div className="flex items-center gap-3 min-w-0">
        <Select value={selectedPipelineId} onValueChange={onPipelineChange}>
          <SelectTrigger className="w-full sm:w-64 md:w-72 lg:w-80 h-12 text-lg font-semibold border-0 bg-transparent hover:bg-accent/50 focus:ring-0 px-0">
            <SelectValue placeholder="Selecionar pipeline" />
          </SelectTrigger>
          <SelectContent>
            {pipelines.map(pipeline => (
              <SelectItem key={pipeline.id} value={pipeline.id} className="text-base py-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{pipeline.nome}</span>
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
        {showAccessBadge && accessInfo.icon && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={accessInfo.variant} className="gap-1 text-xs">
                <accessInfo.icon className="h-3 w-3" />
                {accessInfo.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              Seu nível de acesso neste pipeline
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      
      {/* Only show config buttons if user can manage */}
      {canManage && (
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
      )}
    </div>
  );
}