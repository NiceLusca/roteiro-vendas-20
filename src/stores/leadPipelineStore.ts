import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { LeadPipelineEntry } from '@/types/crm';

/**
 * Store simplificado - Usado APENAS para updates otimistas temporários
 * NÃO é a fonte de verdade dos dados (props são a fonte)
 */
interface LeadPipelineStore {
  // Mapa de updates otimistas em memória
  optimisticUpdates: Map<string, Partial<LeadPipelineEntry>>;

  // Adicionar update otimista
  addOptimisticUpdate: (entryId: string, updates: Partial<LeadPipelineEntry>) => void;
  
  // Buscar update otimista
  getOptimisticUpdate: (entryId: string) => Partial<LeadPipelineEntry> | undefined;
  
  // Limpar update otimista após confirmação
  clearOptimisticUpdate: (entryId: string) => void;
  
  // Limpar todos os updates
  clearAll: () => void;
}

export const useLeadPipelineStore = create<LeadPipelineStore>()(
  devtools(
    (set, get) => ({
      optimisticUpdates: new Map(),

      addOptimisticUpdate: (entryId, updates) => {
        console.log('⚡ [Store] Adicionando update otimista:', { entryId, updates });
        
        set((state) => {
          const newMap = new Map(state.optimisticUpdates);
          newMap.set(entryId, updates);
          return { optimisticUpdates: newMap };
        });
      },

      getOptimisticUpdate: (entryId) => {
        return get().optimisticUpdates.get(entryId);
      },

      clearOptimisticUpdate: (entryId) => {
        console.log('🧹 [Store] Limpando update otimista:', entryId);
        
        set((state) => {
          const newMap = new Map(state.optimisticUpdates);
          newMap.delete(entryId);
          return { optimisticUpdates: newMap };
        });
      },

      clearAll: () => {
        console.log('🧹 [Store] Limpando todos os updates otimistas');
        set({ optimisticUpdates: new Map() });
      }
    }),
    { name: 'LeadPipelineStore' }
  )
);
