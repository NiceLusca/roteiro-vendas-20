import { useParams } from 'react-router-dom';
import { EnhancedPipelineKanban } from '@/components/kanban/EnhancedPipelineKanban';
import { CRMProviderWrapper } from '@/contexts/CRMProviderWrapper';

export default function Pipelines() {
  const { pipelineId } = useParams<{ pipelineId: string }>();

  return (
    <CRMProviderWrapper>
      <EnhancedPipelineKanban pipelineId={pipelineId} />
    </CRMProviderWrapper>
  );
}