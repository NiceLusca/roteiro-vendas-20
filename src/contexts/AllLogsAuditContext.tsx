import React, { createContext, useContext, ReactNode } from 'react';
import { AuditLog } from '@/types/crm';
import { useAudit } from './AuditContext';
import { supabase } from '@/integrations/supabase/client';

interface AllLogsAuditContextType {
  getAllLogs: () => Promise<AuditLog[]>;
}

const AllLogsAuditContext = createContext<AllLogsAuditContextType | undefined>(undefined);

// Extended context that can access all logs across entities
export function AllLogsAuditProvider({ children }: { children: ReactNode }) {
  const { getAuditLogs } = useAudit();

  const getAllLogs = async (): Promise<AuditLog[]> => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Erro ao buscar todos os logs:', error);
        return [];
      }

      return data?.map(log => ({
        id: log.id,
        entidade: log.entidade,
        entidade_id: log.entidade_id,
        ator: log.ator,
        alteracao: (log.alteracao as any) || [],
        timestamp: new Date(log.timestamp)
      })) || [];
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      return [];
    }
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