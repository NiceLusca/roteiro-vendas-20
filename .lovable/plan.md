

# Plano: Adicionar botão "Criar novo prazo" no dialog do KanbanBoard

## Problema Identificado

O `AppointmentSelectorDialog` existe em **dois lugares**:

1. **`src/pages/Pipelines.tsx`** (linhas 860-894) - Usado para movimentações via botoes (Avançar, Recuar, Transferir)
2. **`src/components/kanban/KanbanBoard.tsx`** (linhas 493-502) - Usado para movimentações via **drag-and-drop**

A correção anterior adicionou a prop `onCreateNew` apenas na instancia do Pipelines.tsx.
Quando o usuario arrasta o card, o dialog renderizado pelo KanbanBoard.tsx eh exibido, e este NAO possui a prop `onCreateNew`.

## Solucao

Adicionar a prop `onCreateNew` na instancia do `AppointmentSelectorDialog` dentro do `KanbanBoard.tsx`.

## Arquivo a Modificar

`src/components/kanban/KanbanBoard.tsx` - linhas 493-502

### Codigo Atual (sem onCreateNew)

```typescript
<AppointmentSelectorDialog
  open={appointmentSelectorState.open}
  onOpenChange={(open) => setAppointmentSelectorState(prev => ({ ...prev, open }))}
  appointments={appointmentSelectorState.appointments}
  stageName={appointmentSelectorState.stageName}
  leadName={appointmentSelectorState.leadName}
  onConfirm={handleAppointmentSelected}
  onCancel={handleAppointmentSelectorCancel}
  isLoading={isMovingWithAppointment}
/>
```

### Codigo Corrigido (com onCreateNew)

```typescript
<AppointmentSelectorDialog
  open={appointmentSelectorState.open}
  onOpenChange={(open) => setAppointmentSelectorState(prev => ({ ...prev, open }))}
  appointments={appointmentSelectorState.appointments}
  stageName={appointmentSelectorState.stageName}
  leadName={appointmentSelectorState.leadName}
  onConfirm={handleAppointmentSelected}
  onCancel={handleAppointmentSelectorCancel}
  onCreateNew={() => {
    // Fechar o seletor de agendamento
    setAppointmentSelectorState(prev => ({ ...prev, open: false, pendingMove: null }));
    // Abrir o dialog de edicao do lead na aba Agenda
    if (onEditLead && appointmentSelectorState.pendingMove?.entry.lead_id) {
      onEditLead(appointmentSelectorState.pendingMove.entry.lead_id, { initialTab: 'appointments' });
    }
  }}
  isLoading={isMovingWithAppointment}
/>
```

## Fluxo Esperado Apos Correcao

```text
Usuario arrasta card para etapa com agendamento obrigatorio
                    |
                    v
   AppointmentSelectorDialog (KanbanBoard.tsx)
                    |
  +--------+--------+----------------+
  |        |        |                |
  v        v        v                v
Cancelar  Criar novo prazo   Confirmar e Mover
            |                        |
            v                        v
   LeadEditDialog               Move lead com
   (aba Agenda)              appointment vinculado
```

## Resultado

O botao "Criar novo prazo" aparecera no dialog quando o usuario arrastar um lead para uma etapa que requer agendamento, permitindo que ele cancele a movimentacao e abra o dialog do lead diretamente na aba Agenda para criar um novo agendamento.

