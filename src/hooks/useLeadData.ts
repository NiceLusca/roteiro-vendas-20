import { useState } from 'react';

export function useLeadData(leadId?: string) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(false);

  const refetch = async () => {};

  return {
    lead,
    loading,
    refetch
  };
}
