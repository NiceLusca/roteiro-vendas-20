import { EnhancedPipelineKanban } from '@/components/kanban/EnhancedPipelineKanban';
import { CRMProviderWrapper } from '@/contexts/CRMProviderWrapper';

export default function Pipelines() {
  return (
    <CRMProviderWrapper>
      <EnhancedPipelineKanban />
    </CRMProviderWrapper>
  );
}