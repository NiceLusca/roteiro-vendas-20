
# Plano: Responsaveis por Pipeline (Nao Interpipelines)

## Problema Atual

A tabela `lead_responsibles` vincula responsaveis ao `lead_id`, fazendo com que um responsavel atribuido em um pipeline seja visivel em todos os outros pipelines onde o lead esta inscrito.

## Solucao Proposta

Modificar o sistema para vincular responsaveis ao `pipeline_entry_id` em vez do `lead_id`, permitindo que cada inscricao em pipeline tenha seus proprios responsaveis.

## Alteracoes no Banco de Dados

### 1. Adicionar coluna `pipeline_entry_id` a tabela `lead_responsibles`

```sql
-- Adicionar coluna opcional para pipeline_entry
ALTER TABLE lead_responsibles 
ADD COLUMN pipeline_entry_id UUID REFERENCES lead_pipeline_entries(id) ON DELETE CASCADE;

-- Criar indice para performance
CREATE INDEX idx_lead_responsibles_entry_id ON lead_responsibles(pipeline_entry_id);
```

### 2. Atualizar constraint UNIQUE

```sql
-- Remover constraint antiga (lead_id, user_id)
ALTER TABLE lead_responsibles DROP CONSTRAINT lead_responsibles_lead_id_user_id_key;

-- Nova constraint: unico por entry + user
ALTER TABLE lead_responsibles 
ADD CONSTRAINT lead_responsibles_entry_user_unique UNIQUE (pipeline_entry_id, user_id);
```

### 3. Migrar dados existentes (manter atuais)

Os dados existentes permanecerao com `pipeline_entry_id = NULL`, representando responsaveis "globais" legados. Novos registros terao o `pipeline_entry_id` preenchido.

## Alteracoes no Codigo

### 1. Interface e Types (`src/hooks/useLeadResponsibles.ts`)

Adicionar `pipeline_entry_id` a interface:

```typescript
export interface LeadResponsible {
  id: string;
  lead_id: string;
  pipeline_entry_id?: string | null; // NOVO
  user_id: string;
  // ... resto igual
}
```

### 2. Hook `useLeadResponsibles`

Modificar para aceitar `pipelineEntryId` como parametro:

**Antes:**
```typescript
export const useLeadResponsibles = (leadId?: string) => {
```

**Depois:**
```typescript
export const useLeadResponsibles = (leadId?: string, pipelineEntryId?: string) => {
```

**Query modificada:**
- Se `pipelineEntryId` fornecido: filtrar por `pipeline_entry_id`
- Senao: comportamento legado (filtrar por `lead_id`)

### 3. Mutations atualizadas

**assignResponsible:**
```typescript
// Inserir com pipeline_entry_id
const { error: insertError } = await supabase
  .from('lead_responsibles')
  .insert({
    lead_id: leadId,
    pipeline_entry_id: pipelineEntryId, // NOVO
    user_id: userId,
    assigned_by: user?.id,
    is_primary: isPrimary,
  });
```

### 4. Hook `useMultipleLeadResponsibles`

Modificar para receber `Map<leadId, entryId>` ou array de entry IDs:

```typescript
export const useMultipleLeadResponsibles = (
  entryMap: Record<string, string> // { leadId: entryId }
) => {
  const entryIds = Object.values(entryMap);
  
  // Buscar por pipeline_entry_id
  const { data, error } = await supabase
    .from('lead_responsibles')
    .select(...)
    .in('pipeline_entry_id', entryIds);
    
  // Agrupar por lead_id (usando o map invertido)
}
```

### 5. `ResponsibleSelector` Component

Adicionar prop `pipelineEntryId`:

```typescript
interface ResponsibleSelectorProps {
  leadId: string;
  pipelineEntryId?: string; // NOVO
  performerName?: string;
}
```

### 6. `LeadEditDialog`

Passar `pipelineEntryId` para o ResponsibleSelector:

```tsx
<ResponsibleSelector 
  leadId={lead.id} 
  pipelineEntryId={pipelineEntryId} // NOVO
  performerName={currentUserName}
/>
```

### 7. `Pipelines.tsx`

Atualizar chamada do hook para passar entryIds:

```typescript
// Criar mapa leadId -> entryId
const entryMap = useMemo(() => {
  const map: Record<string, string> = {};
  leadPipelineEntries.forEach(entry => {
    map[entry.lead_id] = entry.id;
  });
  return map;
}, [leadPipelineEntries]);

const { data: responsiblesMap = {} } = useMultipleLeadResponsibles(entryMap);
```

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| Nova migration SQL | Adicionar coluna `pipeline_entry_id`, indices, constraints |
| `src/hooks/useLeadResponsibles.ts` | Adicionar param `pipelineEntryId`, queries e mutations |
| `src/components/leads/ResponsibleSelector.tsx` | Prop `pipelineEntryId` |
| `src/components/kanban/LeadEditDialog.tsx` | Passar `pipelineEntryId` |
| `src/pages/Pipelines.tsx` | Passar mapa de entries para hook |

## Comportamento Esperado

1. **Dados existentes**: Permanecem com `pipeline_entry_id = NULL` (compatibilidade)
2. **Novos responsaveis**: Salvos com `pipeline_entry_id` preenchido
3. **Visualizacao**: Cada pipeline mostra apenas responsaveis daquele pipeline
4. **Historico**: Registros de historico continuam funcionando normalmente

## Fluxo de Dados

```text
Pipeline A                    Pipeline B
    |                             |
Entry #1 (Lead X)            Entry #2 (Lead X)
    |                             |
Responsaveis:                Responsaveis:
  - Joao (primary)             - Maria (primary)
  - Ana                        - Pedro
```

O mesmo lead pode ter responsaveis diferentes em cada pipeline.
