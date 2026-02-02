
# Correção: Campos SLA não sendo buscados do banco

## Diagnóstico

O problema foi identificado: a etapa "Não Fechou (quente)" **está corretamente configurada** no banco de dados com:
- `requer_agendamento: true`
- `sla_baseado_em: agendamento`

Porém, o hook `useSupabasePipelineStages.ts` que busca as etapas para o Kanban **não inclui esses campos no SELECT**, então os valores chegam como `undefined` no componente.

**Evidência do banco:**
```
nome: Não Fechou (quente)
requer_agendamento: true
sla_baseado_em: agendamento
```

**Query atual (linhas 41-67):**
```typescript
.select(`
  id, pipeline_id, nome, ordem, prazo_em_dias, 
  proximo_passo_tipo, proximo_passo_label, ...
  grupo, cor_grupo, created_at, updated_at
`)
// ❌ Faltam: sla_baseado_em, requer_agendamento
```

## Solução

Adicionar os campos `sla_baseado_em` e `requer_agendamento` à query do hook.

## Alteração

### Arquivo: `src/hooks/useSupabasePipelineStages.ts`

**Linhas 63-66**: Adicionar os novos campos na query SELECT:

```typescript
// Antes
          proxima_etapa_id,
          grupo,
          cor_grupo,
          created_at,

// Depois
          proxima_etapa_id,
          grupo,
          cor_grupo,
          sla_baseado_em,
          requer_agendamento,
          created_at,
```

**Linhas 7-25**: Atualizar interface local do hook para incluir os tipos:

```typescript
interface PipelineStage {
  // ... campos existentes ...
  cor_grupo?: string | null;
  sla_baseado_em?: 'entrada' | 'agendamento'; // NOVO
  requer_agendamento?: boolean; // NOVO
  created_at: string;
  updated_at: string;
}
```

## Resultado Esperado

Após a correção:
1. Os campos `sla_baseado_em` e `requer_agendamento` serão carregados do banco
2. A validação em `KanbanBoard.tsx` (linha 211) receberá `requer_agendamento: true`
3. Ao mover o lead para "Não Fechou (quente)", o sistema irá:
   - Verificar se há agendamentos
   - Bloquear se não houver
   - Solicitar seleção se houver múltiplos

## Resumo

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useSupabasePipelineStages.ts` | Adicionar `sla_baseado_em` e `requer_agendamento` à query SELECT e à interface local |
