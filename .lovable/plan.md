
# Plano: Sempre abrir dialog de confirmação de agendamento

## Objetivo

Modificar o comportamento para que o dialog de seleção de agendamento **sempre** abra quando a etapa requer agendamento, mesmo quando há apenas 1 agendamento. Isso permite ao usuário:
1. Confirmar se deseja usar o agendamento existente
2. Ver claramente qual data será usada como deadline do SLA
3. Optar por cancelar e criar um novo agendamento se preferir

## Alterações Necessárias

### 1. Modificar validação para sempre requerer seleção

**Arquivo:** `src/lib/appointmentValidator.ts`

Alterar a lógica de 1 agendamento para também requerer seleção:

```typescript
// ANTES (linhas 66-73):
// 1 agendamento - vincular automaticamente
if (appointments.length === 1) {
  return {
    valid: true,
    appointments,
    requiresSelection: false  // ← Não abre dialog
  };
}

// DEPOIS:
// 1 ou mais agendamentos - sempre solicitar confirmação
if (appointments.length >= 1) {
  return {
    valid: true,
    appointments,
    requiresSelection: true,  // ← Sempre abre dialog
    message: appointments.length === 1 
      ? 'Confirme o agendamento para o prazo SLA'
      : 'Selecione qual agendamento usar para o prazo SLA'
  };
}
```

### 2. Adaptar handlers de avanço/retrocesso

**Arquivo:** `src/pages/Pipelines.tsx`

Os handlers `handleAdvanceStage` e `handleRegressStage` atualmente bloqueiam quando `requiresSelection: true`, pedindo para usar drag & drop. Precisamos permitir que abram o seletor diretamente:

```typescript
// ANTES (linhas 288-295):
if (validation.requiresSelection) {
  toast({
    title: 'Múltiplos agendamentos',
    description: 'Selecione o agendamento ao mover pelo Kanban (drag & drop)',
    variant: 'default'
  });
  return;
}

// DEPOIS:
if (validation.requiresSelection) {
  // Abrir seletor de agendamento
  setPendingAppointmentSelection({
    entryId,
    entry,
    fromStage: currentStage,
    toStage: nextStage,
    appointments: validation.appointments,
    leadName: entry.leads?.nome || 'Lead',
    stageName: nextStage.nome
  });
  return;
}
```

### 3. Adicionar estado e dialog de seleção no Pipelines.tsx

**Arquivo:** `src/pages/Pipelines.tsx`

Adicionar:
- Estado para controlar o dialog de seleção
- O componente `AppointmentSelectorDialog`
- Handler para confirmar a seleção

```typescript
// Novo estado
const [pendingAppointmentSelection, setPendingAppointmentSelection] = useState<{
  entryId: string;
  entry: LeadPipelineEntry;
  fromStage: PipelineStage;
  toStage: PipelineStage;
  appointments: AppointmentOption[];
  leadName: string;
  stageName: string;
} | null>(null);

// Handler de confirmação
const handleAppointmentSelected = async (appointmentId: string) => {
  if (!pendingAppointmentSelection) return;
  
  await moveLead({
    entry: pendingAppointmentSelection.entry,
    fromStage: pendingAppointmentSelection.fromStage,
    toStage: pendingAppointmentSelection.toStage,
    checklistItems: [],
    currentEntriesInTargetStage: 0,
    appointmentSlaId: appointmentId,
    onSuccess: handleRefresh
  });
  
  setPendingAppointmentSelection(null);
};

// No JSX, adicionar o dialog
<AppointmentSelectorDialog
  open={!!pendingAppointmentSelection}
  onOpenChange={(open) => !open && setPendingAppointmentSelection(null)}
  appointments={pendingAppointmentSelection?.appointments || []}
  stageName={pendingAppointmentSelection?.stageName || ''}
  leadName={pendingAppointmentSelection?.leadName || ''}
  onConfirm={handleAppointmentSelected}
  onCancel={() => setPendingAppointmentSelection(null)}
/>
```

### 4. Atualizar mensagem do dialog

**Arquivo:** `src/components/kanban/AppointmentSelectorDialog.tsx`

Ajustar a descrição para cobrir o caso de 1 agendamento:

```typescript
<DialogDescription>
  A etapa <strong>"{stageName}"</strong> calcula o SLA baseado na data do agendamento.
  <br />
  {appointments.length === 1 
    ? <>Confirme se este é o agendamento correto para <strong>{leadName}</strong>:</>
    : <>Selecione qual agendamento de <strong>{leadName}</strong> usar:</>
  }
</DialogDescription>
```

## Fluxo Corrigido

```text
Etapa requer agendamento?
         │
        Sim
         │
         ▼
  Quantos agendamentos?
         │
    ┌────┴────┐
    0         ≥1
    │          │
    ▼          ▼
 Bloquear   Abrir dialog
 + Abrir    de confirmação
 aba Agenda     │
                ▼
         Usuário confirma
         ou cancela
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/appointmentValidator.ts` | Alterar lógica para sempre requerer seleção quando há agendamentos |
| `src/pages/Pipelines.tsx` | Adicionar estado e dialog de seleção, adaptar handlers |
| `src/components/kanban/AppointmentSelectorDialog.tsx` | Ajustar mensagem para caso de 1 agendamento |

## Benefícios

1. Transparência para o usuário sobre qual data será o deadline
2. Oportunidade de cancelar e criar novo agendamento se necessário
3. Comportamento consistente independente do número de agendamentos
4. Evita movimentações acidentais com agendamento incorreto
