import { useEffect, useRef } from 'react';
import { useAudit } from '@/contexts/AuditContext';

/**
 * Hook para auditoria automática de formulários
 * Compara estados anterior e atual para gerar logs de mudança
 */
export function useFormAudit<T extends Record<string, any>>(
  entidade: string,
  entidade_id: string,
  currentData: T,
  enabled: boolean = true
) {
  const { logChange } = useAudit();
  const previousDataRef = useRef<T>();

  useEffect(() => {
    if (!enabled || !previousDataRef.current || !entidade_id) return;

    const changes: Array<{ campo: string; de: any; para: any }> = [];
    const previous = previousDataRef.current;

    // Comparar campos
    Object.keys(currentData).forEach(key => {
      const oldValue = previous[key];
      const newValue = currentData[key];

      // Ignorar mudanças em timestamps automáticos
      if (key === 'updated_at' || key === 'created_at') return;

      // Comparação profunda básica
      const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);

      if (hasChanged) {
        changes.push({
          campo: key,
          de: oldValue,
          para: newValue
        });
      }
    });

    if (changes.length > 0) {
      logChange({
        entidade,
        entidade_id,
        alteracao: changes
      });
    }

    previousDataRef.current = { ...currentData };
  }, [currentData, entidade, entidade_id, enabled, logChange]);

  // Armazenar dados iniciais
  useEffect(() => {
    if (enabled && currentData) {
      previousDataRef.current = { ...currentData };
    }
  }, [enabled]);

  return {
    trackChanges: () => {
      previousDataRef.current = { ...currentData };
    }
  };
}