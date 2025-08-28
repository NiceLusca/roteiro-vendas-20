import React, { createContext, useContext, ReactNode } from 'react';
import { AuditLog } from '@/types/crm';
import { useAudit } from './AuditContext';

interface AllLogsAuditContextType {
  getAllLogs: () => AuditLog[];
}

const AllLogsAuditContext = createContext<AllLogsAuditContextType | undefined>(undefined);

// Extended context that can access all logs across entities
export function AllLogsAuditProvider({ children }: { children: ReactNode }) {
  const { getAuditLogs } = useAudit();

  // TODO: Implement a method to get ALL audit logs, not just per entity
  // For now, return empty array since the base context only provides entity-specific logs
  const getAllLogs = (): AuditLog[] => {
    return [];
  };

  return (
    <AllLogsAuditContext.Provider value={{ getAllLogs }}>
      {children}
    </AllLogsAuditContext.Provider>
  );
}

export function useAllLogsAudit() {
  const context = useContext(AllLogsAuditContext);
  if (context === undefined) {
    throw new Error('useAllLogsAudit must be used within an AllLogsAuditProvider');
  }
  return context;
}