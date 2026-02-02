
# Plano: SLA Vinculado a Agendamento com Seleção Manual

## Resumo da Solicitação

Quando um lead é movido para uma etapa com SLA baseado em agendamento:
- **Se houver múltiplos agendamentos**: Exibir seletor para o usuário escolher qual agendamento usar
- **Se o agendamento passar**: Continuar contando o atraso a partir da data original

## Alterações Necessárias

### 1. Banco de Dados

#### Tabela `pipeline_stages` (nova coluna)
```sql
ALTER TABLE pipeline_stages
ADD COLUMN sla_baseado_em TEXT DEFAULT 'entrada' CHECK (sla_baseado_em IN ('entrada', 'agendamento')),
ADD COLUMN requer_agendamento BOOLEAN DEFAULT false;
```

#### Tabela `lead_pipeline_entries` (nova coluna)
```sql
ALTER TABLE lead_pipeline_entries
ADD COLUMN agendamento_sla_id UUID REFERENCES appointments(id) ON DELETE SET NULL;
```

Esta nova coluna armazena o ID do agendamento específico que o usuário selecionou para calcular o SLA daquele card.

### 2. Formulário de Etapas (StageForm.tsx)

Adicionar nova seção de configuração:

```text
┌─────────────────────────────────────────────────────────┐
│ Configuração de SLA                                     │
├─────────────────────────────────────────────────────────┤
│ Prazo SLA (dias): [___]                                 │
│                                                         │
│ Base do cálculo:                                        │
│ ○ Data de entrada na etapa (padrão)                     │
│ ● Data do agendamento                                   │
│   └── ☑ Bloquear movimentação se não houver agendamento │
└─────────────────────────────────────────────────────────┘
```

### 3. Fluxo de Movimentação

Quando um lead é movido para uma etapa com `sla_baseado_em = 'agendamento'`:

```text
┌────────────────────────────────────────────────────────────────┐
│ Usuário arrasta lead para etapa "Agendado"                     │
└────────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │ Etapa requer agendamento?             │
        └───────────────────────────────────────┘
                 │                    │
               Não                   Sim
                 │                    │
                 ▼                    ▼
        ┌─────────────┐    ┌─────────────────────────────┐
        │ Move normal │    │ Buscar agendamentos do lead │
        └─────────────┘    └─────────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                0 agends          1 agend           2+ agends
                    │                  │                  │
                    ▼                  ▼                  ▼
           ┌──────────────┐    ┌──────────────┐   ┌─────────────────┐
           │ Bloquear e   │    │ Vincular     │   │ Abrir dialog    │
           │ abrir card   │    │ automatico   │   │ para selecionar │
           │ na aba Agenda│    │ e mover      │   │ qual agendamento│
           └──────────────┘    └──────────────┘   └─────────────────┘
```

### 4. Novo Dialog: Seletor de Agendamento para SLA

Quando houver múltiplos agendamentos, exibir dialog:

```text
┌─────────────────────────────────────────────────────────┐
│  Selecione o agendamento para o prazo                   │
│─────────────────────────────────────────────────────────│
│                                                         │
│  A etapa "Agendado" calcula o SLA baseado na data do    │
│  agendamento. Selecione qual usar:                      │
│                                                         │
│  ○ 📅 05/02/2026 às 14:00 - Sessão Estratégica         │
│  ● 📅 10/02/2026 às 10:00 - Apresentação Comercial     │
│  ○ 📅 15/02/2026 às 16:00 - Follow-up                  │
│                                                         │
│  [ Cancelar ]                     [ Confirmar e Mover ] │
└─────────────────────────────────────────────────────────┘
```

### 5. Cálculo de SLA no KanbanCard

Alterar a lógica de cálculo:

```typescript
// Atual: usa data_entrada_etapa
const daysInStage = entry.data_entrada_etapa 
  ? Math.floor((Date.now() - new Date(entry.data_entrada_etapa).getTime()) / (1000 * 60 * 60 * 24))
  : 0;

// Novo: verifica se tem agendamento vinculado
const slaBaseDate = useMemo(() => {
  // Se a etapa usa SLA baseado em agendamento E tem agendamento vinculado
  if (stage.sla_baseado_em === 'agendamento' && entry.agendamento_sla_id && appointmentInfo) {
    // Usa a data do agendamento (mesmo que seja passada)
    return new Date(appointmentInfo.data_hora);
  }
  // Senão, usa data de entrada na etapa
  return new Date(entry.data_entrada_etapa);
}, [stage.sla_baseado_em, entry.agendamento_sla_id, appointmentInfo, entry.data_entrada_etapa]);

const daysFromSlaBase = Math.floor((Date.now() - slaBaseDate.getTime()) / (1000 * 60 * 60 * 24));
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| Migração SQL | Adicionar colunas `sla_baseado_em`, `requer_agendamento` em `pipeline_stages` e `agendamento_sla_id` em `lead_pipeline_entries` |
| `src/types/crm.ts` | Adicionar campos nos tipos `PipelineStage` e `LeadPipelineEntry` |
| `src/components/forms/StageForm.tsx` | Adicionar seção de configuração de SLA baseado em agendamento |
| `src/lib/leadMovementValidator.ts` | Adicionar validação assíncrona de agendamento obrigatório |
| `src/hooks/useLeadMovement.ts` | Tratar casos de múltiplos agendamentos, retornar flag para abrir seletor |
| `src/components/kanban/AppointmentSelectorDialog.tsx` | **Novo** - Dialog para selecionar agendamento quando houver múltiplos |
| `src/components/kanban/KanbanBoard.tsx` | Interceptar movimentação e exibir dialog de seleção |
| `src/components/kanban/KanbanCard.tsx` | Alterar cálculo de SLA para considerar `agendamento_sla_id` |
| `src/hooks/usePipelineDisplayData.ts` | Incluir dados do agendamento vinculado ao SLA |

---

## Exemplo de Uso

### Cenário: Lead com 2 agendamentos

1. **Gabriel** (closer) arrasta o lead **Maria** para etapa "Agendado"
2. O sistema detecta que Maria tem 2 agendamentos:
   - 05/02 às 14:00 - Sessão Estratégica
   - 10/02 às 10:00 - Apresentação Comercial
3. Abre o dialog de seleção
4. Gabriel escolhe o agendamento de 10/02
5. Lead é movido com `agendamento_sla_id` = ID do agendamento de 10/02
6. O card exibe SLA calculado a partir de 10/02:
   - Hoje é 08/02 → "2d restantes"
   - Hoje é 10/02 → "Vence hoje!"
   - Hoje é 12/02 → "2d atrasado"

### Cenário: Lead sem agendamento

1. **Gabriel** arrasta o lead **João** para etapa "Agendado"
2. O sistema detecta que João não tem agendamentos
3. O sistema bloqueia e abre o dialog do lead na aba "Agenda"
4. Mensagem: "Defina um agendamento para mover para esta etapa"

---

## Considerações Técnicas

### Vínculo Persiste Mesmo Se Agendamento Passar

O campo `agendamento_sla_id` mantém a referência mesmo após a data do agendamento passar. Isso garante que:
- O SLA continue mostrando "Xd atrasado" baseado na data original
- O histórico do vínculo seja preservado
- A contagem seja consistente

### Performance

A busca de agendamentos é feita apenas quando:
1. A etapa de destino tem `requer_agendamento = true`
2. O lead está sendo movido (não em cada render)

### Migração de Dados Existentes

Leads já nas etapas "Agendado", "Confirmado", etc. terão `agendamento_sla_id = null`, mantendo o comportamento atual (SLA baseado em entrada). O novo comportamento só se aplica a novas movimentações.
