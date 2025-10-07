import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLeadTags } from '@/hooks/useLeadTags';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { useSupabasePipelineStages } from '@/hooks/useSupabasePipelineStages';
import { ArrowLeft, Upload, FileSpreadsheet, Tag, GitBranch, Users } from 'lucide-react';

interface PreviewAndConfirmStepProps {
  fileData: { headers: string[]; rows: any[][]; fileName: string };
  mapping: any[];
  selectedTags: string[];
  selectedPipelines: Array<{ pipelineId: string; stageId: string }>;
  onConfirm: () => void;
  onBack: () => void;
}

export function PreviewAndConfirmStep({
  fileData,
  mapping,
  selectedTags,
  selectedPipelines,
  onConfirm,
  onBack,
}: PreviewAndConfirmStepProps) {
  const { tags } = useLeadTags();
  const { pipelines } = useSupabasePipelines();
  const { stages } = useSupabasePipelineStages();

  const mappedFields = mapping.filter(m => m.targetField);
  const selectedTagsData = tags.filter(t => selectedTags.includes(t.id));

  const getPipelineName = (pipelineId: string) => {
    return pipelines.find(p => p.id === pipelineId)?.nome || '';
  };

  const getStageName = (stageId: string) => {
    return stages.find(s => s.id === stageId)?.nome || '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Revisar e Confirmar</h3>
        <p className="text-sm text-muted-foreground">
          Revise as configurações antes de iniciar a importação
        </p>
      </div>

      <div className="space-y-4">
        {/* Arquivo */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileSpreadsheet className="h-4 w-4" />
            <span className="font-medium text-sm">Arquivo</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Nome:</span>
              <span className="font-medium">{fileData.fileName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total de leads:</span>
              <span className="font-medium">{fileData.rows.length}</span>
            </div>
          </div>
        </div>

        {/* Mapeamento */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4" />
            <span className="font-medium text-sm">Campos Mapeados</span>
            <Badge variant="secondary">{mappedFields.length}</Badge>
          </div>
          <div className="space-y-1">
            {mappedFields.map((field) => (
              <div key={field.sourceColumn} className="text-sm flex items-center gap-2">
                <span className="text-muted-foreground">{field.sourceColumn}</span>
                <span>→</span>
                <span className="font-medium">{field.targetField}</span>
                {field.isRequired && (
                  <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4" />
            <span className="font-medium text-sm">Tags</span>
            {selectedTagsData.length > 0 && (
              <Badge variant="secondary">{selectedTagsData.length}</Badge>
            )}
          </div>
          {selectedTagsData.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {selectedTagsData.map((tag) => (
                <Badge
                  key={tag.id}
                  style={{ backgroundColor: tag.cor, color: 'white' }}
                >
                  {tag.nome}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma tag selecionada</p>
          )}
        </div>

        {/* Pipelines */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="h-4 w-4" />
            <span className="font-medium text-sm">Pipelines</span>
            {selectedPipelines.length > 0 && (
              <Badge variant="secondary">{selectedPipelines.length}</Badge>
            )}
          </div>
          {selectedPipelines.length > 0 ? (
            <div className="space-y-2">
              {selectedPipelines.map((selected) => (
                <div key={selected.pipelineId} className="text-sm">
                  <span className="font-medium">{getPipelineName(selected.pipelineId)}</span>
                  <span className="text-muted-foreground"> → {getStageName(selected.stageId)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum pipeline selecionado</p>
          )}
        </div>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <p className="text-sm font-medium mb-1">⚠️ Atenção</p>
        <p className="text-sm text-muted-foreground">
          A importação não pode ser desfeita. Verifique todas as configurações antes de confirmar.
        </p>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={onConfirm} size="lg">
          <Upload className="h-4 w-4 mr-2" />
          Iniciar Importação
        </Button>
      </div>
    </div>
  );
}
