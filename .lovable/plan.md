
# Correção: Dialog não abre + Origem não salva

## Problemas Identificados

### Problema 1: Dialog não abre ao mover para "Não Fechou (quente)"

**Diagnóstico:**
Após análise do código e banco de dados, confirmei que:
- A etapa "Não Fechou (quente)" está **corretamente configurada** com `requer_agendamento: true`
- O hook `useSupabasePipelineStages` já busca os campos corretamente
- Os tipos TypeScript estão corretos

**Causa provável:**
A movimentação pode estar ocorrendo por um caminho alternativo que não passa pela validação. Há dois locais onde leads podem ser movidos:
1. `KanbanBoard.handleDropLead` - tem a validação de agendamento ✓
2. `Pipelines.handleAdvanceStage` - **NÃO** tem a validação de agendamento ✗

Quando o usuário clica no botão de avançar etapa (em vez de arrastar), a função `handleAdvanceStage` é chamada diretamente, **pulando a validação de agendamento**.

### Problema 2: Origem não salva

**Diagnóstico:**
Ao analisar o fluxo de salvamento:
1. `handleSaveOrigem` chama `saveLead({ id: lead.id, origem: origemToSave })`
2. `saveLead` recebe o ID, identifica como update explícito
3. O payload é criado corretamente

**Causa provável:**
O toast "Origem atualizada" usa `toast.success()` da biblioteca Sonner, mas o `useLeadSave` também dispara um toast interno com `toast()` do shadcn. Isso pode estar causando confusão visual.

Porém, o problema real pode ser que o `saveLead` retorna `null` silenciosamente quando `!user`, ou há um erro não capturado.

## Correções Necessárias

### Correção 1: Adicionar validação de agendamento ao `handleAdvanceStage`

**Arquivo:** `src/pages/Pipelines.tsx`

Atualmente (linha 250-273):
```typescript
const handleAdvanceStage = useCallback(async (entryId: string) => {
  const entry = allEntries.find(e => e.id === entryId);
  if (!entry) return;
  
  const currentStageIndex = pipelineStages.findIndex(s => s.id === entry.etapa_atual_id);
  const currentStage = pipelineStages[currentStageIndex];
  const nextStage = ...
  
  if (!currentStage || !nextStage) return;
  
  // ❌ PROBLEMA: Não valida se nextStage requer agendamento!
  await moveLead({...});
}, [...]);
```

**Solução:** Adicionar validação antes de mover:

```typescript
const handleAdvanceStage = useCallback(async (entryId: string) => {
  const entry = allEntries.find(e => e.id === entryId);
  if (!entry) return;
  
  const currentStageIndex = pipelineStages.findIndex(s => s.id === entry.etapa_atual_id);
  const currentStage = pipelineStages[currentStageIndex];
  const nextStage = ...
  
  if (!currentStage || !nextStage) return;
  
  // ✅ NOVO: Validar agendamento se etapa requer
  if (nextStage.requer_agendamento) {
    const validation = await validateAppointmentRequirement(entry.lead_id, nextStage);
    
    if (!validation.valid) {
      toast({
        title: 'Agendamento necessário',
        description: validation.message || 'Defina um agendamento para mover para esta etapa',
        variant: 'destructive'
      });
      // Abrir dialog na aba agenda
      handleViewOrEditLead(entry.lead_id, { initialTab: 'appointments' });
      return;
    }
    
    if (validation.requiresSelection) {
      // TODO: Abrir seletor de agendamento (por enquanto, usar o primeiro)
      toast({
        title: 'Múltiplos agendamentos',
        description: 'Selecione o agendamento ao mover pelo Kanban (drag & drop)',
        variant: 'default'
      });
      return;
    }
    
    // 1 agendamento - usar automaticamente
    await moveLead({
      entry,
      fromStage: currentStage,
      toStage: nextStage,
      checklistItems: [],
      currentEntriesInTargetStage: 0,
      appointmentSlaId: validation.appointments[0]?.id,
      onSuccess: handleRefresh
    });
    return;
  }
  
  // Movimento normal
  await moveLead({...});
}, [...]);
```

A mesma lógica deve ser aplicada em `handleRegressStage` e `handleConfirmJump`.

### Correção 2: Melhorar feedback de erro no salvamento de origem

**Arquivo:** `src/components/kanban/LeadEditDialog.tsx`

O problema pode ser que o `saveLead` retorna `null` quando há erro, mas o código atual não verifica isso:

```typescript
// Atual (linha 371-374)
await saveLead({
  id: lead.id,
  origem: origemToSave
});

// Corrigido - verificar resultado
const result = await saveLead({
  id: lead.id,
  origem: origemToSave
});

if (!result) {
  toast.error('Erro ao salvar origem - verifique se está logado');
  return;
}
```

### Correção 3: Evitar toast duplicado

O `useLeadSave` já dispara um toast interno. Devemos remover o toast do `handleSaveOrigem` ou modificar o `saveLead` para não disparar toast em updates parciais.

**Opção A:** Adicionar parâmetro `silent` ao `saveLead` para não mostrar toast
**Opção B:** Remover o toast do `handleSaveOrigem` e confiar no toast interno

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Pipelines.tsx` | Adicionar validação de agendamento em `handleAdvanceStage`, `handleRegressStage` e `handleConfirmJump` |
| `src/components/kanban/LeadEditDialog.tsx` | Verificar resultado do `saveLead` e ajustar toast |

## Fluxo Corrigido

```text
┌────────────────────────────────────────────────────────────────┐
│ Usuário clica em "Avançar" ou arrasta lead                     │
└────────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │ Etapa de destino requer agendamento?  │
        └───────────────────────────────────────┘
                 │                    │
               Não                   Sim
                 │                    │
                 ▼                    ▼
        ┌─────────────┐    ┌─────────────────────────────┐
        │ Mover       │    │ Validar agendamentos        │
        │ normalmente │    └─────────────────────────────┘
        └─────────────┘                │
                        ┌──────────────┼──────────────────┐
                        │              │                  │
                   0 agends        1 agend           2+ agends
                        │              │                  │
                        ▼              ▼                  ▼
               ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐
               │ Bloquear e   │  │ Vincular     │  │ Abrir seletor   │
               │ abrir card   │  │ automatico   │  │ (apenas Kanban) │
               │ na aba Agenda│  │ e mover      │  │ ou bloquear     │
               └──────────────┘  └──────────────┘  └─────────────────┘
```

## Resumo Técnico

1. A validação de agendamento estava implementada apenas no `handleDropLead` do KanbanBoard
2. Os botões de avanço/retrocesso chamavam funções que não tinham essa validação
3. Precisamos replicar a validação em todos os pontos de movimentação de leads
4. O salvamento de origem provavelmente funciona, mas pode haver falta de feedback visual adequado
