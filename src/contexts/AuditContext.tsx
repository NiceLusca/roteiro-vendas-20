import React, { createContext, useContext, ReactNode } from 'react';
import { AuditLog } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';

interface AuditContextType {
  logChange: (params: {
    entidade: string;
    entidade_id: string;
    alteracao: Array<{ campo: string; de: any; para: any }>;
    ator?: string;
  }) => void;
  getAuditLogs: (entidade: string, entidade_id: string) => AuditLog[];
}

const AuditContext = createContext<AuditContextType | undefined>(undefined);

// Mock storage - em produção seria uma API/banco
const auditLogs: AuditLog[] = [];

export function AuditProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const logChange = ({
    entidade,
    entidade_id,
    alteracao,
    ator = 'Usuário'
  }: {
    entidade: string;
    entidade_id: string;
    alteracao: Array<{ campo: string; de: any; para: any }>;
    ator?: string;
  }) => {
    const logEntry: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entidade,
      entidade_id,
      alteracao,
      ator,
      timestamp: new Date()
    };

    auditLogs.push(logEntry);
    
    // Toast sutil para confirmação
    if (alteracao.length > 0) {
      toast({
        title: `${entidade} atualizado`,
        description: `${alteracao.length} campo(s) alterado(s)`,
        duration: 2000,
      });
    }
  };

  const getAuditLogs = (entidade: string, entidade_id: string): AuditLog[] => {
    return auditLogs
      .filter(log => log.entidade === entidade && log.entidade_id === entidade_id)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  return (
    <AuditContext.Provider value={{ logChange, getAuditLogs }}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAudit() {
  const context = useContext(AuditContext);
  if (context === undefined) {
    throw new Error('useAudit must be used within an AuditProvider');
  }
  return context;
}