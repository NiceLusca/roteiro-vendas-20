import { useState } from 'react';

export function useBulkLeadImport() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({
    total: 0,
    processed: 0,
    success: 0,
    errors: 0
  });

  const parseLeads = () => [];
  const importLeads = async () => ({ success: [], errors: [] });

  return {
    importing,
    progress,
    parseLeads,
    importLeads
  };
}
