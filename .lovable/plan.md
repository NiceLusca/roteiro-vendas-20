
# Plano: Recuperar Responsáveis Legados

## Problema Identificado

Os responsáveis antigos foram salvos com `pipeline_entry_id = NULL` (antes da migração), mas a query atual só busca por `pipeline_entry_id` específico:

```typescript
.in('pipeline_entry_id', entryIds)  // Não encontra registros com NULL
```

Resultado: todos os cards aparecem "Sem responsável".

## Solução

Modificar a query para buscar **ambos os casos**:
1. Responsáveis vinculados ao `pipeline_entry_id` (novos)
2. Responsáveis vinculados ao `lead_id` onde `pipeline_entry_id IS NULL` (legados)

## Alterações

### 1. Hook `useMultipleLeadResponsibles`

**Antes:**
```typescript
.in('pipeline_entry_id', entryIds)
```

**Depois:**
```typescript
// Buscar por pipeline_entry_id OU por lead_id com entry NULL (legados)
.or(`pipeline_entry_id.in.(${entryIds.join(',')}),and(lead_id.in.(${leadIds.join(',')}),pipeline_entry_id.is.null)`)
```

### 2. Hook `useLeadResponsibles` (para LeadEditDialog)

**Antes:**
```typescript
if (pipelineEntryId) {
  query = query.eq('pipeline_entry_id', pipelineEntryId);
} else {
  query = query.eq('lead_id', leadId).is('pipeline_entry_id', null);
}
```

**Depois:**
```typescript
if (pipelineEntryId) {
  // Buscar por entry específico OU legados deste lead
  query = query.or(`pipeline_entry_id.eq.${pipelineEntryId},and(lead_id.eq.${leadId},pipeline_entry_id.is.null)`);
} else {
  query = query.eq('lead_id', leadId).is('pipeline_entry_id', null);
}
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useLeadResponsibles.ts` | Modificar queries para incluir legados |

## Comportamento Esperado

1. Responsáveis legados (com `pipeline_entry_id = NULL`) continuam aparecendo
2. Novos responsáveis são salvos com `pipeline_entry_id` preenchido
3. Cada pipeline mostra seus responsáveis específicos + legados do lead
4. Migração gradual: quando usuário adiciona/remove responsável, sistema usa o novo formato

## Fluxo de Dados

```text
Consulta para Pipeline "Mentoria Society"
                    |
       +------------+------------+
       |                         |
Responsáveis com            Responsáveis com
pipeline_entry_id           pipeline_entry_id = NULL
= entry atual               E lead_id = lead atual
       |                         |
       +------------+------------+
                    |
              Merge e exibe
```

## Opção de Migração Futura (Opcional)

Após confirmar que está funcionando, podemos criar um script para migrar dados legados:

```sql
-- Atualizar responsáveis legados para associar ao pipeline_entry
UPDATE lead_responsibles lr
SET pipeline_entry_id = lpe.id
FROM lead_pipeline_entries lpe
WHERE lr.lead_id = lpe.lead_id
  AND lr.pipeline_entry_id IS NULL
  AND lpe.status_inscricao = 'Ativo';
```

Isso é opcional e pode ser feito depois.
