
# Plano: Responsáveis por Pipeline (Não Interpipelines)

## ✅ CONCLUÍDO

## Problema Atual

A tabela `lead_responsibles` vinculava responsáveis ao `lead_id`, fazendo com que um responsável atribuído em um pipeline fosse visível em todos os outros pipelines onde o lead está inscrito.

## Solução Implementada

O sistema agora vincula responsáveis ao `pipeline_entry_id` em vez do `lead_id`, permitindo que cada inscrição em pipeline tenha seus próprios responsáveis.

## Alterações Realizadas

### 1. Banco de Dados (Migration)

- ✅ Adicionada coluna `pipeline_entry_id` à tabela `lead_responsibles`
- ✅ Criado índice `idx_lead_responsibles_entry_id` para performance
- ✅ Atualizada constraint UNIQUE para `(pipeline_entry_id, user_id)`
- ✅ Adicionada coluna `pipeline_entry_id` à tabela `lead_responsibility_history`
- ✅ Dados existentes mantidos com `pipeline_entry_id = NULL` (compatibilidade)

### 2. Hook `useLeadResponsibles.ts`

- ✅ Interface `LeadResponsible` atualizada com `pipeline_entry_id?: string | null`
- ✅ Hook aceita novo parâmetro `pipelineEntryId`
- ✅ Query filtra por `pipeline_entry_id` quando fornecido
- ✅ Mutation `assignResponsible` inclui `pipelineEntryId`
- ✅ Hook `useMultipleLeadResponsibles` recebe `Record<string, string>` (leadId → entryId)

### 3. Componente `ResponsibleSelector.tsx`

- ✅ Nova prop `pipelineEntryId?: string`
- ✅ Passa `pipelineEntryId` para o hook e mutations

### 4. Componente `LeadEditDialog.tsx`

- ✅ Passa `pipelineEntryId` para `ResponsibleSelector` e `useLeadResponsibles`

### 5. Página `Pipelines.tsx`

- ✅ Cria mapa `entryMap: Record<string, string>` (leadId → pipelineEntryId)
- ✅ Passa mapa para `useMultipleLeadResponsibles`

## Comportamento Final

1. **Dados existentes**: Permanecem com `pipeline_entry_id = NULL` (compatibilidade)
2. **Novos responsáveis**: Salvos com `pipeline_entry_id` preenchido
3. **Visualização**: Cada pipeline mostra apenas responsáveis daquele pipeline
4. **Histórico**: Registros de histórico continuam funcionando normalmente

## Fluxo de Dados

```text
Pipeline A                    Pipeline B
    |                             |
Entry #1 (Lead X)            Entry #2 (Lead X)
    |                             |
Responsáveis:                Responsáveis:
  - João (primary)             - Maria (primary)
  - Ana                        - Pedro
```

O mesmo lead pode ter responsáveis diferentes em cada pipeline.
