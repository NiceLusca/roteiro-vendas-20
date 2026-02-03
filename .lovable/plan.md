
# Plano: Completar Movimentação Após Criar Agendamento

## Problema

Quando o usuário arrasta um lead para uma etapa que requer agendamento e clica em "Novo prazo":
1. O dialog de seleção fecha e limpa os dados da movimentação pendente
2. O LeadEditDialog abre na aba Agenda
3. Após criar o agendamento e fechar o dialog, o lead permanece na etapa original

## Causa Raiz

O estado `pendingMove` está no **KanbanBoard** (componente filho), mas o **LeadEditDialog** é controlado pelo **Pipelines.tsx** (componente pai). Quando "Novo prazo" é clicado, os dados da movimentação são perdidos.

## Solução Proposta

Elevar a responsabilidade da movimentação pendente para o **Pipelines.tsx**, que já possui infraestrutura similar (`pendingAppointmentSelection`).

### Alterações

#### 1. Pipelines.tsx - Novo estado para movimentação pendente do Kanban

Adicionar estado que armazena dados da movimentação quando o usuário opta por criar novo agendamento:

```typescript
const [pendingKanbanMove, setPendingKanbanMove] = useState<{
  entryId: string;
  leadId: string;
  toStageId: string;
} | null>(null);
```

#### 2. KanbanBoard - Nova prop para notificar movimentação pendente

Passar callback `onPendingMoveForNewAppointment` que permite ao KanbanBoard informar ao Pipelines que há uma movimentação aguardando novo agendamento:

```typescript
interface KanbanBoardProps {
  // ... props existentes
  onPendingMoveForNewAppointment?: (data: { entryId: string; leadId: string; toStageId: string }) => void;
}
```

#### 3. KanbanBoard - onCreateNew atualizado

Em vez de limpar `pendingMove`, chamar o callback antes de abrir o dialog:

```typescript
onCreateNew={() => {
  const { pendingMove } = appointmentSelectorState;
  if (pendingMove) {
    onPendingMoveForNewAppointment?.({
      entryId: appointmentSelectorState.entryId,
      leadId: pendingMove.entry.lead_id,
      toStageId: pendingMove.toStage.id
    });
  }
  setAppointmentSelectorState(prev => ({ ...prev, open: false, pendingMove: null }));
  if (onEditLead && pendingMove?.entry.lead_id) {
    onEditLead(pendingMove.entry.lead_id, { initialTab: 'appointments' });
  }
}}
```

#### 4. Pipelines.tsx - Detectar novo agendamento e completar movimentação

Modificar o `onUpdate` do LeadEditDialog para verificar se há movimentação pendente:

```typescript
onUpdate={() => {
  handleRefresh();
  
  // Se havia movimentação pendente para novo agendamento, tentar completar
  if (pendingKanbanMove && editingLead?.lead.id === pendingKanbanMove.leadId) {
    completePendingMove(pendingKanbanMove);
  }
}}
```

#### 5. Nova função completePendingMove

Buscar agendamentos do lead e revalidar/executar a movimentação:

```typescript
const completePendingMove = useCallback(async (pending: typeof pendingKanbanMove) => {
  if (!pending) return;
  
  const entry = allEntries.find(e => e.id === pending.entryId);
  const toStage = pipelineStages.find(s => s.id === pending.toStageId);
  const fromStage = pipelineStages.find(s => s.id === entry?.etapa_atual_id);
  
  if (!entry || !toStage || !fromStage) {
    setPendingKanbanMove(null);
    return;
  }
  
  // Revalidar agendamento
  const validation = await validateAppointmentRequirement(pending.leadId, toStage);
  
  if (!validation.valid) {
    toast({ title: 'Agendamento ainda necessário', variant: 'destructive' });
    setPendingKanbanMove(null);
    return;
  }
  
  if (validation.requiresSelection && validation.appointments.length > 1) {
    // Múltiplos agendamentos - abrir seletor novamente
    setPendingAppointmentSelection({
      entryId: pending.entryId,
      entry: entry as any,
      fromStage,
      toStage,
      appointments: validation.appointments,
      leadName: entry.leads?.nome || 'Lead',
      stageName: toStage.nome
    });
  } else {
    // 1 agendamento - mover automaticamente
    await moveLead({
      entry: entry as any,
      fromStage,
      toStage,
      checklistItems: [],
      currentEntriesInTargetStage: allEntries.filter(e => e.etapa_atual_id === toStage.id).length,
      appointmentSlaId: validation.appointments[0]?.id,
      onSuccess: handleRefresh
    });
    toast({ title: 'Lead movido com sucesso!' });
  }
  
  setPendingKanbanMove(null);
}, [allEntries, pipelineStages, moveLead, handleRefresh, toast]);
```

## Fluxo Esperado

```
Usuário arrasta lead → Etapa requer agendamento
           ↓
AppointmentSelectorDialog exibido
           ↓
Usuário clica "Novo prazo"
           ↓
KanbanBoard notifica Pipelines via callback
Pipelines armazena pendingKanbanMove
LeadEditDialog abre na aba Agenda
           ↓
Usuário cria agendamento e fecha dialog
           ↓
onUpdate chamado → detecta pendingKanbanMove
           ↓
completePendingMove revalida e move o lead
           ↓
Lead aparece na etapa destino ✓
```

## Arquivos a Modificar

1. **src/components/kanban/KanbanBoard.tsx**
   - Adicionar prop `onPendingMoveForNewAppointment`
   - Atualizar lógica do `onCreateNew`

2. **src/pages/Pipelines.tsx**
   - Adicionar estado `pendingKanbanMove`
   - Criar função `completePendingMove`
   - Passar callback para KanbanBoard
   - Modificar `onUpdate` do LeadEditDialog

## Detalhes Técnicos

- A revalidação é necessária porque o agendamento pode ter sido criado para data passada ou o usuário pode ter fechado sem criar
- Se houver múltiplos agendamentos após criar o novo, o seletor reaparece para o usuário escolher qual usar
- O estado `pendingKanbanMove` é limpo após a operação (sucesso ou falha)
