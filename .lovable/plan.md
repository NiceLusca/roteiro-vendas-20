

# Plano: Corrigir Inscrição de Agendamentos no Pipeline Comercial

## Problema Identificado

O webhook `agenda-webhook` está usando `status_inscricao = 'ativo'` (minúsculo), mas o banco de dados tem um CHECK constraint que só aceita `'Ativo'` (com A maiúsculo).

**Resultado:** 120+ agendamentos desde 22/01 criaram leads e appointments, mas **não foram inscritos no pipeline comercial**.

## Solução

### 1. Corrigir o Edge Function `agenda-webhook`

**Arquivo:** `supabase/functions/agenda-webhook/index.ts`

Alterar linha 248:
```typescript
// DE:
status_inscricao: 'ativo',

// PARA:
status_inscricao: 'Ativo',
```

### 2. Inscrever os Leads Pendentes no Pipeline

Executar SQL para inscrever os leads que foram criados mas não entraram no pipeline:

```sql
INSERT INTO lead_pipeline_entries (lead_id, pipeline_id, etapa_atual_id, status_inscricao, data_inscricao, data_entrada_etapa, saude_etapa)
SELECT 
  l.id,
  'f46a3fad-da4e-4f16-88f3-15b24f3b09b3', -- Pipeline Comercial
  '27b4ef65-5e2b-4c32-a601-a9291c72f963', -- Etapa "Agendado"
  'Ativo',
  l.created_at,
  l.created_at,
  'Verde'
FROM leads l
LEFT JOIN lead_pipeline_entries lpe 
  ON lpe.lead_id = l.id 
  AND lpe.pipeline_id = 'f46a3fad-da4e-4f16-88f3-15b24f3b09b3'
WHERE l.created_at > '2026-01-22'
  AND lpe.id IS NULL
  AND l.origem = 'Agenda Oceano';
```

## Arquivos a Modificar

| # | Arquivo | Alteracao |
|---|---------|-----------|
| 1 | `supabase/functions/agenda-webhook/index.ts` | Trocar 'ativo' por 'Ativo' (linha 248) |

## Notas Adicionais

**Sobre a origem do lead no pipeline:**

A origem já está sendo salva corretamente como "Agenda Oceano". Se você quiser exibir a origem nos cards do Kanban ou na tabela do pipeline, isso pode ser configurado via `display_config` do pipeline. O campo `origem` já faz parte dos campos disponíveis.

