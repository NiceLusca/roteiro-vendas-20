import { Dashboard } from '@/components/dashboard/Dashboard';
import { CRMProviderWrapper } from '@/contexts/CRMProviderWrapper';

const Index = () => {
  return (
    <div className="p-6 h-full overflow-auto">
      <CRMProviderWrapper>
        <Dashboard />
      </CRMProviderWrapper>
    </div>
  );
};

export default Index;
