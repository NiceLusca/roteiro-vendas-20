import { PipelineAnalyticsDashboard } from '@/components/reports/PipelineAnalyticsDashboard';
import { RealtimeMetrics } from '@/components/reports/RealtimeMetrics';
import { DataExport } from '@/components/reports/DataExport';

export default function Reports() {
  return (
    <div className="p-6 h-full overflow-auto">
      <div className="space-y-6">
        <RealtimeMetrics />
        <PipelineAnalyticsDashboard />
        <DataExport />
      </div>
    </div>
  );
}