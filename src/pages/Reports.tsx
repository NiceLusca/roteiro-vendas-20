import { PipelineAnalyticsDashboard } from '@/components/reports/PipelineAnalyticsDashboard';
import { RealtimeMetrics } from '@/components/reports/RealtimeMetrics';
import { DataExport } from '@/components/reports/DataExport';

export default function Reports() {
  return (
    <div className="space-y-6">
      <RealtimeMetrics />
      <PipelineAnalyticsDashboard />
      <DataExport />
    </div>
  );
}