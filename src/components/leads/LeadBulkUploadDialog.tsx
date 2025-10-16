import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ImportStep } from '@/types/bulkImport';
import { ColumnMappingStep } from './ColumnMappingStep';
import { DefaultValuesStep } from './DefaultValuesStep';
import { TagSelectionStep } from './TagSelectionStep';
import { PipelineSelectionStep } from './PipelineSelectionStep';
import { PreviewAndConfirmStep } from './PreviewAndConfirmStep';
import { useFileProcessor } from '@/hooks/useFileProcessor';
import { useBulkLeadImport } from '@/hooks/useBulkLeadImport';
import { Upload, X } from 'lucide-react';

interface LeadBulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LeadBulkUploadDialog({ open, onOpenChange, onSuccess }: LeadBulkUploadDialogProps) {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [fileData, setFileData] = useState<{ headers: string[]; rows: any[][]; fileName: string } | null>(null);
  const [mapping, setMapping] = useState<any[]>([]);
  const [defaultValues, setDefaultValues] = useState<Record<string, any>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPipelines, setSelectedPipelines] = useState<Array<{ pipelineId: string; stageId: string }>>([]);
  
  const { processFile, processing } = useFileProcessor();
  const { parseLeads, importLeads, progress, importing } = useBulkLeadImport();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const processed = await processFile(file);
    if (processed) {
      setFileData(processed);
      setCurrentStep('mapping');
    }
  };

  const handleMappingComplete = (mappingData: any[]) => {
    setMapping(mappingData);
    setCurrentStep('defaults');
  };

  const handleDefaultsComplete = (defaults: Record<string, any>) => {
    setDefaultValues(defaults);
    setCurrentStep('tags');
  };

  const handleTagsComplete = (tags: string[]) => {
    setSelectedTags(tags);
    setCurrentStep('pipelines');
  };

  const handlePipelinesComplete = (pipelines: Array<{ pipelineId: string; stageId: string }>) => {
    setSelectedPipelines(pipelines);
    setCurrentStep('preview');
  };

  const handleConfirm = async () => {
    if (!fileData) return;

    setCurrentStep('processing');
    const parsedLeads = parseLeads(fileData.rows, fileData.headers, mapping, defaultValues);
    const result = await importLeads(parsedLeads, selectedTags, selectedPipelines);

    if (result.success) {
      onSuccess?.();
      handleClose();
    }
  };

  const handleClose = () => {
    setCurrentStep('upload');
    setFileData(null);
    setMapping([]);
    setDefaultValues({});
    setSelectedTags([]);
    setSelectedPipelines([]);
    onOpenChange(false);
  };

  const getStepNumber = () => {
    const steps: ImportStep[] = ['upload', 'mapping', 'defaults', 'tags', 'pipelines', 'preview', 'processing'];
    return steps.indexOf(currentStep) + 1;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Importar Leads via Planilha</DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {currentStep !== 'upload' && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Passo {getStepNumber()} de 6</span>
                <span>{Math.round((getStepNumber() / 6) * 100)}%</span>
              </div>
              <Progress value={(getStepNumber() / 6) * 100} className="h-2" />
            </div>
          )}
        </DialogHeader>

        <div className="py-4">
          {currentStep === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Selecione uma planilha</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Formatos aceitos: .xlsx, .xls, .csv
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={processing}
                />
                <Button asChild disabled={processing}>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {processing ? 'Processando...' : 'Escolher Arquivo'}
                  </label>
                </Button>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Dicas para o arquivo:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>A primeira linha deve conter os cabeçalhos das colunas</li>
                  <li>Nome e WhatsApp são campos obrigatórios</li>
                  <li>Máximo de 1000 leads por importação</li>
                  <li>O formato do WhatsApp deve incluir DDD</li>
                </ul>
              </div>
            </div>
          )}

          {currentStep === 'mapping' && fileData && (
            <ColumnMappingStep
              headers={fileData.headers}
              sampleRows={fileData.rows.slice(0, 3)}
              onComplete={handleMappingComplete}
              onBack={() => setCurrentStep('upload')}
            />
          )}

          {currentStep === 'defaults' && (
            <DefaultValuesStep
              mapping={mapping}
              onComplete={handleDefaultsComplete}
              onBack={() => setCurrentStep('mapping')}
            />
          )}

          {currentStep === 'tags' && (
            <TagSelectionStep
              onComplete={handleTagsComplete}
              onBack={() => setCurrentStep('defaults')}
            />
          )}

          {currentStep === 'pipelines' && (
            <PipelineSelectionStep
              onComplete={handlePipelinesComplete}
              onBack={() => setCurrentStep('tags')}
            />
          )}

          {currentStep === 'preview' && fileData && (
            <PreviewAndConfirmStep
              fileData={fileData}
              mapping={mapping}
              selectedTags={selectedTags}
              selectedPipelines={selectedPipelines}
              onConfirm={handleConfirm}
              onBack={() => setCurrentStep('pipelines')}
            />
          )}

          {currentStep === 'processing' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Importando leads...</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Processando {progress.processed} de {progress.total} leads
                </p>
              </div>

              <Progress value={(progress.processed / progress.total) * 100} className="h-3" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-success">{progress.created}</div>
                  <div className="text-sm text-muted-foreground">Criados</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-info">{progress.updated}</div>
                  <div className="text-sm text-muted-foreground">Atualizados</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-danger">{progress.errors}</div>
                  <div className="text-sm text-muted-foreground">Erros</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{progress.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
