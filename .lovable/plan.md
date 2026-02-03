
# Plano: Desfazer Acao, Filtro Entrega Hoje e Deletar Agendamento

## Visao Geral

Este plano implementa tres funcionalidades solicitadas:
1. Botao para desfazer ultima acao de movimentacao no pipeline
2. Filtro para exibir apenas cards com entrega/agendamento para hoje
3. Possibilidade de apagar agendamentos com registro no historico

---

## 1. Botao Desfazer Acao

### Objetivo
Permitir que o usuario desfaca a ultima movimentacao de lead no pipeline.

### Abordagem Tecnica

**Armazenar historico de movimentacoes:**
- Criar estado `lastMoveAction` em `Pipelines.tsx` para guardar dados da ultima movimentacao
- Estrutura: `{ entryId, fromStageId, toStageId, leadName, timestamp }`
- O estado e limpo apos 60 segundos ou apos uso

**Modificacoes em `useLeadMovement.ts`:**
- Retornar dados da movimentacao para permitir desfazer
- Nova funcao `undoMove` que reverte a etapa anterior

**Interface:**
- Botao "Desfazer" aparece na barra de filtros quando ha acao para desfazer
- Timer visual mostrando tempo restante (60s)
- Toast de confirmacao ao desfazer

### Arquivos a Modificar

1. **`src/hooks/useLeadMovement.ts`**
   - Modificar `moveLead` para retornar `previousStageId`
   - Adicionar funcao `undoMove(entryId, previousStageId)`

2. **`src/pages/Pipelines.tsx`**
   - Novo estado `lastMoveAction` com timeout
   - Passar callback para KanbanBoard registrar movimentacoes
   - Botao "Desfazer" na barra de filtros
   - Handler `handleUndoLastMove`

### Fluxo

```text
Lead movido de A para B
       |
Pipelines.tsx salva: { entryId, fromStageId: A, toStageId: B }
       |
Botao "Desfazer" aparece com timer de 60s
       |
Usuario clica "Desfazer"
       |
undoMove(entryId, A) -> Lead volta para etapa A
       |
Toast: "Movimentacao desfeita"
Estado limpo
```

---

## 2. Filtro Entrega Hoje

### Objetivo
Filtrar cards cujo agendamento vinculado (SLA) ou proximo agendamento seja para hoje.

### Abordagem Tecnica

**Novo filtro na URL:**
- Query param `delivery=today`
- Adicionar no seletor de filtros junto aos demais

**Logica de filtragem:**
- Verificar `entry.agendamento_sla_id` com data de hoje
- Ou verificar `nextAppointment.start_at` para hoje
- Usar `slaAppointmentsById` ja disponivel

### Arquivos a Modificar

1. **`src/pages/Pipelines.tsx`**
   - Novo filtro na URL: `delivery`
   - Logica de filtragem no `allEntries` verificando agendamentos de hoje
   - Select para filtro "Entrega hoje" na barra de filtros

2. **`src/hooks/useSlaAppointments.ts`** (sem alteracao)
   - Ja fornece `slaAppointmentsById` usado para validar data

### Interface

```text
+--------------------------------------------------+
| [Kanban] [Tabela] | Pipeline | Busca...         |
| [Responsavel v] [Tag v] [Entrega v] [Ordenar v] |
+--------------------------------------------------+
                         ^
                    Novo filtro:
                    - Todas
                    - Entrega Hoje
                    - Entrega Proximos 3 dias
```

---

## 3. Deletar Agendamento com Registro no Historico

### Objetivo
Permitir deletar agendamentos do lead, mas registrar a acao no `lead_activity_log`.

### Abordagem Tecnica

**Novo tipo de atividade:**
- Adicionar `appointment_deleted` ao tipo `ActivityType`
- Atualizar `LeadActivityTimeline` para exibir este tipo

**Funcao de delete:**
- Nova funcao `deleteAppointment` em `useSupabaseAppointments.ts`
- Antes de deletar, registrar atividade via `useLeadActivityLog`
- Limpar `agendamento_sla_id` de entries que referenciam o agendamento

**Interface:**
- Adicionar botao de delete na lista de agendamentos do `LeadEditDialog`
- Confirmacao antes de deletar
- Icone de lixeira em cada agendamento

### Arquivos a Modificar

1. **`src/hooks/useLeadActivityLog.ts`**
   - Adicionar tipo `appointment_deleted` ao `ActivityType`

2. **`src/components/timeline/LeadActivityTimeline.tsx`**
   - Adicionar config para `appointment_deleted` com icone Calendar + cor vermelha
   - Formatar descricao: "Usuario deletou agendamento de DD/MM/YYYY"

3. **`src/hooks/useSupabaseAppointments.ts`**
   - Nova funcao `deleteAppointment(appointmentId, leadId)`
   - Limpar referencias em `lead_pipeline_entries.agendamento_sla_id`

4. **`src/components/kanban/LeadEditDialog.tsx`**
   - Botao de delete em cada item de agendamento
   - Dialog de confirmacao
   - Chamar `logActivity` antes de deletar

### Fluxo

```text
Usuario clica em icone lixeira no agendamento
              |
Dialog: "Tem certeza? Esta acao sera registrada no historico"
              |
Confirma: Sim
              |
logActivity({ type: 'appointment_deleted', details: { titulo, data_hora } })
              |
deleteAppointment(id)
              |
Se entry.agendamento_sla_id === id: limpar referencia
              |
Toast: "Agendamento removido"
Historico mostra: "Joao deletou agendamento de 05/02/2026"
```

---

## Resumo das Alteracoes por Arquivo

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useLeadMovement.ts` | Funcao `undoMove`, retornar dados para undo |
| `src/hooks/useLeadActivityLog.ts` | Tipo `appointment_deleted` |
| `src/hooks/useSupabaseAppointments.ts` | Funcao `deleteAppointment` |
| `src/pages/Pipelines.tsx` | Estado undo, filtro entrega hoje, botao desfazer |
| `src/components/timeline/LeadActivityTimeline.tsx` | Config visual para appointment_deleted |
| `src/components/kanban/LeadEditDialog.tsx` | Botao delete agendamento com confirmacao |

---

## Consideracoes de UX

- **Desfazer**: Botao aparece por 60s apos movimentacao, com contador visual
- **Filtro entrega hoje**: Icone de calendario com cor destacada quando ativo
- **Delete agendamento**: Confirmacao obrigatoria, feedback de que ficara no historico

## Detalhes Tecnicos

- Undo: Usa mesma logica de `moveLead` invertendo from/to
- Filtro hoje: Compara `new Date().toDateString()` com data do agendamento
- Delete: Soft-aware - limpa referencias antes de deletar para evitar FK errors
- Historico: Detalhes salvos em JSON incluem titulo e data do agendamento deletado
