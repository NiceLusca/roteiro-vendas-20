

# Plano: Adicionar opção "Criar novo prazo" e Otimizar carregamento do Pipeline

## Problemas Identificados

### Problema 1: Falta opção para criar novo agendamento no dialog

Quando o usuário abre o dialog de confirmação de agendamento (ao mover para etapa que requer agendamento), só é possível:
- Confirmar o agendamento existente
- Cancelar

**Falta**: Uma opção para criar um novo agendamento/prazo quando o usuário não quer usar o existente.

### Problema 2: Carregamento lento dos leads

O pipeline "Comercial" tem 147 leads ativos. O carregamento está lento por conta de:
1. **Query principal** busca todos os 147 leads com JOINs para `leads` e `pipeline_stages`
2. **Queries adicionais** em paralelo:
   - `usePipelineDisplayData` busca deals e appointments para todos os leads
   - `useMultipleLeadResponsibles` busca responsáveis de todos os leads
   - `useMultipleLeadTags` busca tags de todos os leads
3. **Sem paginação** quando `noPagination=true` (que é o padrão para pipelines específicos)

## Correções Propostas

### Correção 1: Adicionar botão "Criar novo prazo" no dialog

**Arquivo:** `src/components/kanban/AppointmentSelectorDialog.tsx`

Adicionar:
- Novo prop `onCreateNew` para callback de criação
- Botão "Criar novo prazo" que cancela a movimentação e abre o dialog do lead na aba Agenda

```typescript
interface AppointmentSelectorDialogProps {
  // ... props existentes
  onCreateNew?: () => void;  // Novo callback
}
```

No footer do dialog, adicionar botão entre Cancelar e Confirmar:
```tsx
<DialogFooter className="gap-2 sm:gap-0">
  <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
    Cancelar
  </Button>
  {onCreateNew && (
    <Button variant="ghost" onClick={onCreateNew} disabled={isLoading}>
      <Plus className="w-4 h-4 mr-2" />
      Criar novo prazo
    </Button>
  )}
  <Button onClick={handleConfirm} disabled={!selectedId || isLoading}>
    Confirmar e Mover
  </Button>
</DialogFooter>
```

**Arquivo:** `src/pages/Pipelines.tsx`

Adicionar handler `onCreateNew` no `AppointmentSelectorDialog`:
```typescript
onCreateNew={() => {
  if (pendingAppointmentSelection) {
    setPendingAppointmentSelection(null);
    handleViewOrEditLead(pendingAppointmentSelection.entry.lead_id, { initialTab: 'appointments' });
  }
}}
```

### Correção 2: Otimizar carregamento com campos selecionados

**Arquivo:** `src/hooks/useSupabaseLeadPipelineEntries.ts`

Reduzir campos no SELECT para trazer apenas o necessário:
```typescript
// ANTES - busca muitos campos
leads!fk_lead_pipeline_entries_lead(
  id, nome, email, whatsapp, status_geral,
  closer, lead_score, lead_score_classification,
  valor_lead, user_id, created_at, updated_at
)

// DEPOIS - apenas campos exibidos no Kanban
leads!fk_lead_pipeline_entries_lead(
  id, nome, email, whatsapp, closer, lead_score, origem
)
```

### Correção 3: Adicionar loading progressivo

**Arquivo:** `src/hooks/useSupabaseLeadPipelineEntries.ts`

Implementar carregamento em duas fases:
1. **Fase 1**: Carregar apenas campos essenciais para exibição inicial (id, nome, etapa)
2. **Fase 2**: Carregar dados adicionais em background

```typescript
// Fase 1: Dados mínimos para renderizar Kanban imediatamente
const quickQuery = supabase
  .from('lead_pipeline_entries')
  .select(`
    id, lead_id, pipeline_id, etapa_atual_id, data_entrada_etapa,
    leads!fk_lead_pipeline_entries_lead(id, nome)
  `)
  .eq('status_inscricao', 'Ativo')
  .eq('pipeline_id', effectivePipelineId);
```

### Correção 4: Otimizar hooks auxiliares para uso de batch

**Arquivo:** `src/hooks/usePipelineDisplayData.ts`

Aumentar staleTime e adicionar cache mais agressivo:
```typescript
staleTime: 30000, // 30 seconds (era 10s)
cacheTime: 60000, // 1 minuto de cache
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/kanban/AppointmentSelectorDialog.tsx` | Adicionar prop `onCreateNew` e botão "Criar novo prazo" |
| `src/pages/Pipelines.tsx` | Passar handler `onCreateNew` para o dialog |
| `src/hooks/useSupabaseLeadPipelineEntries.ts` | Reduzir campos no SELECT + adicionar campo `origem` |
| `src/hooks/usePipelineDisplayData.ts` | Aumentar staleTime para melhor cache |

## Fluxo do Dialog Atualizado

```text
┌─────────────────────────────────────────────────────────────────┐
│                   Confirme o agendamento                        │
├─────────────────────────────────────────────────────────────────┤
│  A etapa "Não Fechou (quente)" calcula o SLA baseado na data... │
├─────────────────────────────────────────────────────────────────┤
│  ◉ 28/01/2026 às 13:15  [Passado]                               │
│    Sessão Estratégica-Gênios da Oceano Azul - Gabriel...        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Cancelar]    [+ Criar novo prazo]    [Confirmar e Mover]      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Benefícios

1. **Novo prazo**: Usuário pode criar um novo agendamento em vez de usar um passado
2. **Carregamento mais rápido**: Menos campos = menos dados = resposta mais rápida
3. **Cache otimizado**: Reduz chamadas repetidas ao servidor
4. **Campo origem**: Corrige o bug de origem não aparecer ao reabrir o lead

