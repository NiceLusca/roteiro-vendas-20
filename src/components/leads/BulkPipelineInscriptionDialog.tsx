import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GitBranch, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Pipeline {
  id: string;
  nome: string;
}

interface Stage {
  id: string;
  nome: string;
  ordem: number;
}

interface Lead {
  id: string;
  nome: string;
  email?: string;
}

interface BulkPipelineInscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadIds: string[];
  previewLeads: Lead[];
  onConfirm: (pipelineId: string, stageId: string, skipExisting: boolean) => Promise<void>;
  isLoading: boolean;
  progress: number;
}

export function BulkPipelineInscriptionDialog({
  open,
  onOpenChange,
  leadIds,
  previewLeads,
  onConfirm,
  isLoading,
  progress
}: BulkPipelineInscriptionDialogProps) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [skipExisting, setSkipExisting] = useState(true);
  const [loadingPipelines, setLoadingPipelines] = useState(false);
  const [loadingStages, setLoadingStages] = useState(false);

  useEffect(() => {
    if (open) {
      loadPipelines();
    }
  }, [open]);

  useEffect(() => {
    if (selectedPipeline) {
      loadStages(selectedPipeline);
    } else {
      setStages([]);
      setSelectedStage('');
    }
  }, [selectedPipeline]);

  const loadPipelines = async () => {
    setLoadingPipelines(true);
    try {
      const { data, error } = await supabase
        .from('pipelines')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setPipelines(data || []);
    } catch (error) {
      console.error('Erro ao carregar pipelines:', error);
    } finally {
      setLoadingPipelines(false);
    }
  };

  const loadStages = async (pipelineId: string) => {
    setLoadingStages(true);
    try {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('id, nome, ordem')
        .eq('pipeline_id', pipelineId)
        .order('ordem');

      if (error) throw error;
      setStages(data || []);
      
      // Selecionar primeira etapa por padrão
      if (data && data.length > 0) {
        setSelectedStage(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
    } finally {
      setLoadingStages(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedPipeline || !selectedStage) return;
    await onConfirm(selectedPipeline, selectedStage, skipExisting);
  };

  const canConfirm = selectedPipeline && selectedStage && !isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Inscrever Leads em Pipeline
          </DialogTitle>
          <DialogDescription>
            Inscrever {leadIds.length} lead{leadIds.length !== 1 ? 's' : ''} em um pipeline
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seletor de Pipeline */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Pipeline</label>
            <Select
              value={selectedPipeline}
              onValueChange={setSelectedPipeline}
              disabled={isLoading || loadingPipelines}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map(pipeline => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seletor de Etapa */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Etapa Inicial</label>
            <Select
              value={selectedStage}
              onValueChange={setSelectedStage}
              disabled={isLoading || loadingStages || !selectedPipeline}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma etapa" />
              </SelectTrigger>
              <SelectContent>
                {stages.map(stage => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.ordem}. {stage.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Opção para pular já inscritos */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="skip-existing"
              checked={skipExisting}
              onCheckedChange={(checked) => setSkipExisting(checked as boolean)}
              disabled={isLoading}
            />
            <label
              htmlFor="skip-existing"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Pular leads já inscritos neste pipeline
            </label>
          </div>

          {/* Preview de leads */}
          {previewLeads.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Preview dos primeiros leads:</label>
              <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
                {previewLeads.slice(0, 10).map(lead => (
                  <div key={lead.id} className="text-sm">
                    <span className="font-medium">{lead.nome}</span>
                    {lead.email && <span className="text-muted-foreground"> ({lead.email})</span>}
                  </div>
                ))}
                {previewLeads.length > 10 && (
                  <div className="text-sm text-muted-foreground">
                    ... e mais {previewLeads.length - 10} lead{previewLeads.length - 10 !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Aviso */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta ação irá inscrever os leads selecionados no pipeline escolhido. 
              Leads já inscritos {skipExisting ? 'serão pulados' : 'podem gerar duplicatas'}.
            </AlertDescription>
          </Alert>

          {/* Progress bar */}
          {isLoading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Inscrevendo leads... {progress}%
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {isLoading ? 'Inscrevendo...' : 'Confirmar Inscrição'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
