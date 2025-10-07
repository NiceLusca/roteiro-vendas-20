import { useState } from 'react';

export function useSupabaseLeadPipelineEntries(pipelineId?: string) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const inscribeLead = async () => null;
  const updateEntry = async () => {};
  const archiveEntry = async () => {};
  const refetch = async () => {};

  return {
    entries,
    loading,
    inscribeLead,
    updateEntry,
    archiveEntry,
    refetch
  };
}
