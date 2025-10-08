import { useParams, useNavigate } from 'react-router-dom';
import { EnhancedPipelineKanban } from '@/components/kanban/EnhancedPipelineKanban';
import { CRMProviderWrapper } from '@/contexts/CRMProviderWrapper';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { EnhancedLoading } from '@/components/ui/enhanced-loading';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export default function Pipelines() {
  const { pipelineId } = useParams<{ pipelineId: string }>();
  const navigate = useNavigate();
  const { pipelines, loading } = useSupabasePipelines();

  const activePipelines = pipelines.filter(p => p.ativo);

  useEffect(() => {
    if (!loading && !pipelineId && activePipelines.length > 0) {
      // Se não houver pipelineId na URL, redirecionar para seleção
      navigate('/pipelines/select', { replace: true });
    }
  }, [loading, pipelineId, activePipelines, navigate]);

  if (loading) {
    return <EnhancedLoading loading={true}><></></EnhancedLoading>;
  }

  if (!pipelineId) {
    return null;
  }

  const currentPipeline = pipelines.find(p => p.id === pipelineId);

  if (!currentPipeline) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Pipeline não encontrado</h2>
          <Button onClick={() => navigate('/pipelines/select')}>
            Voltar para seleção
          </Button>
        </div>
      </div>
    );
  }

  return (
    <CRMProviderWrapper>
      <div className="space-y-4">
        {activePipelines.length > 1 && (
          <div className="px-6 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/pipelines/select')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para seleção de pipelines
            </Button>
          </div>
        )}
        <EnhancedPipelineKanban selectedPipelineId={pipelineId} />
      </div>
    </CRMProviderWrapper>
  );
}