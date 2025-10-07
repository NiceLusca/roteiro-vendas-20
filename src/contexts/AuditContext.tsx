import React, { createContext, useContext, ReactNode } from 'react';
import { AuditLog } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AuditContextType {
  logChange: (params: {
    entidade: string;
    entidade_id: string;
    alteracao: Array<{ campo: string; de: any; para: any }>;
    ator?: string;
  }) => Promise<void>;
  getAuditLogs: (entidade: string, entidade_id: string) => Promise<AuditLog[]>;
}

const AuditContext = createContext<AuditContextType | undefined>(undefined);

// Real Supabase storage

export function AuditProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const logChange = async ({
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
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          entidade,
          entidade_id,
          alteracao,
          ator
        });

      if (error) {
        console.error('Erro ao salvar log de auditoria:', error);
        return;
      }
      
      // Toast sutil para confirmação
      if (alteracao.length > 0) {
        toast({
          title: `${entidade} atualizado`,
          description: `${alteracao.length} campo(s) alterado(s)`,
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Erro ao fazer log de auditoria:', error);
    }
  };

  const getAuditLogs = async (entidade: string, entidade_id: string): Promise<AuditLog[]> => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entidade', entidade)
        .eq('entidade_id', entidade_id)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Erro ao buscar logs de auditoria:', error);
        return [];
      }

      return data?.map(log => ({
        ator: log.ator || undefined,
        entidade: log.entidade,
        entidade_id: log.entidade_id,
        id: log.id,
        timestamp: log.timestamp,
        alteracao: log.alteracao as Array<{ campo: string; de: any; para: any }>
      })) || [];
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error);
      return [];
    }
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