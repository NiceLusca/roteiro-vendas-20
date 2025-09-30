import { Dashboard } from '@/components/dashboard/Dashboard';
import { CRMProviderWrapper } from '@/contexts/CRMProviderWrapper';

const Index = () => {
  return (
    <CRMProviderWrapper>
      <Dashboard />
    </CRMProviderWrapper>
  );
};

export default Index;
