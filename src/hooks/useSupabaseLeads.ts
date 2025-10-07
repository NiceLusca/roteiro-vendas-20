import { useState } from 'react';

export function useSupabaseLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);

  const saveLead = async () => null;
  const deleteLead = async () => {};
  const refetch = async () => {};

  return {
    leads,
    loading,
    saveLead,
    deleteLead,
    refetch
  };
}
