import { useState } from 'react';

export function useSupabasePipelineAnalytics(pipelineId?: string) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  const refetch = async () => {};

  return {
    metrics,
    loading,
    refetch
  };
}
