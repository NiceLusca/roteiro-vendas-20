import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { LeadPipelineEntry, Lead, PipelineStage } from '@/types/crm';

export interface EnrichedEntry extends LeadPipelineEntry {
  lead: Lead;
  stage?: PipelineStage;
}

interface LeadPipelineStore {
  entries: EnrichedEntry[];
  loading: boolean;
  lastUpdated: number;

  // Atualização otimista - UI instantânea
  updateEntryOptimistic: (entryId: string, updates: Partial<LeadPipelineEntry>) => void;
  
  // Reverter update otimista em caso de erro
  revertOptimisticUpdate: (entryId: string, originalEntry: LeadPipelineEntry) => void;
  
  // Setar dados iniciais
  setEntries: (entries: EnrichedEntry[]) => void;
  
  // Buscar entry específica
  getEntry: (entryId: string) => EnrichedEntry | undefined;
  
  // Limpar store
  clear: () => void;
}

export const useLeadPipelineStore = create<LeadPipelineStore>()(
  devtools(
    (set, get) => ({
      entries: [],
      loading: false,
      lastUpdated: 0,

      updateEntryOptimistic: (entryId, updates) => {
        console.log('⚡ [Store] Update otimista:', { entryId, updates });
        
        set((state) => ({
          entries: state.entries.map(entry =>
            entry.id === entryId 
              ? { ...entry, ...updates }
              : entry
          ),
          lastUpdated: Date.now()
        }));
      },

      revertOptimisticUpdate: (entryId, originalEntry) => {
        console.log('🔄 [Store] Revertendo update otimista:', entryId);
        
        set((state) => ({
          entries: state.entries.map(entry =>
            entry.id === entryId 
              ? { ...entry, ...originalEntry }
              : entry
          ),
          lastUpdated: Date.now()
        }));
      },

      setEntries: (entries) => {
        set({ 
          entries, 
          loading: false,
          lastUpdated: Date.now() 
        });
      },

      getEntry: (entryId) => {
        return get().entries.find(e => e.id === entryId);
      },

      clear: () => {
        set({ 
          entries: [], 
          loading: false,
          lastUpdated: 0 
        });
      }
    }),
    { name: 'LeadPipelineStore' }
  )
);
