
## Plano de Correção: Histórico do Pipeline

### Problema 1: Scroll não funciona - apenas 7 atividades visíveis

**Causa:** O `ScrollArea` do Radix UI precisa de configuração específica para funcionar com `maxHeight` inline. O `Viewport` interno não está herdando a altura.

**Solução:** Alterar a estrutura para usar uma `div` com overflow-y-auto e altura máxima, ou passar a className correta para o ScrollArea.

### Problema 2: Mostrar apenas logs do pipeline atual

**Causa:** O hook `useLeadActivityLog` foi modificado para remover o filtro de `pipeline_entry_id`, agora busca todos os logs do lead.

**Solução:** Restaurar o filtro para mostrar apenas atividades com `pipeline_entry_id` igual ao do pipeline atual.

---

### Alterações Necessárias

#### 1. `src/hooks/useLeadActivityLog.ts`
- Restaurar o filtro por `pipeline_entry_id` na query
- Filtrar apenas atividades que pertencem ao pipeline atual (não incluir `pipeline_entry_id = null`)
- Query final: `WHERE lead_id = ? AND pipeline_entry_id = ?`

```typescript
const fetchActivities = useCallback(async (id: string, entryId?: string) => {
  if (!id) return;
  
  setLoading(true);
  try {
    let query = supabase
      .from('lead_activity_log')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false });

    // Filtrar apenas atividades do pipeline específico
    if (entryId) {
      query = query.eq('pipeline_entry_id', entryId);
    }

    const { data, error } = await query;
    // ...
  }
}, []);
```

#### 2. `src/components/timeline/LeadActivityTimeline.tsx`
- Substituir `ScrollArea` por uma `div` simples com `overflow-y-auto` e `max-h-[500px]`
- Isso garante que o scroll funcione corretamente

```tsx
// Substituir:
<ScrollArea style={{ maxHeight }}>
  <div className="space-y-2 pr-4">...</div>
</ScrollArea>

// Por:
<div 
  className="overflow-y-auto pr-2" 
  style={{ maxHeight }}
>
  <div className="space-y-2">...</div>
</div>
```

---

### Resultado Esperado
- O histórico mostrará apenas atividades do pipeline atual (stage_change, inscription, transfer desse pipeline)
- Todos os 26 logs do pipeline serão visíveis através de scroll vertical
- A contagem no badge continuará mostrando o número correto
