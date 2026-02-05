
# Plano: Corrigir Paginação no Pipeline Pós-Venda

## Problema Identificado

O pipeline mostra "100 brutos → 91 filtrados" mesmo sem filtros porque:

1. **Banco de dados**: 132 leads ativos no pipeline pós-venda
2. **UI**: Mostra apenas 100 registros (paginação aplicada indevidamente)
3. **Causa**: O callback de realtime chama `fetchEntries(pipelineId, true, false)` sem o parâmetro `noPagination`, aplicando paginação de 100 registros

## Locais Afetados

No arquivo `src/hooks/useSupabaseLeadPipelineEntries.ts`:

### Linha 489 - Realtime callback

```typescript
// ANTES (aplica paginação de 100)
fetchEntries(pipelineId, true, false);

// DEPOIS (busca todos os registros)
fetchEntries(pipelineId, true, false, true);
```

### Linha 504 - loadMore function

Esta função também precisa ser revisada, pois usa paginação para infinite scroll. Porém, quando estamos em um pipeline específico, não deveria usar paginação.

## Alterações

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `src/hooks/useSupabaseLeadPipelineEntries.ts` | 489 | Adicionar `true` para `noPagination` no realtime callback |
| `src/hooks/useSupabaseLeadPipelineEntries.ts` | 504 | Verificar se pipeline específico antes de paginar |

## Código Corrigido

```typescript
// Realtime callback (linha 486-490)
debounceTimer = setTimeout(() => {
  setPage(0);
  // Buscar sem paginação quando há pipelineId específico
  fetchEntries(pipelineId, true, false, !!pipelineId);
}, 2000);
```

## Comportamento Esperado

1. Ao abrir pipeline pós-venda: carrega todos os 132 leads (sem paginação)
2. Ao receber update realtime: mantém todos os registros (sem paginação)
3. Sem filtros aplicados: "132 brutos → 132 filtrados"
4. O debug counter só mostrará diferença quando houver filtros reais ativos
