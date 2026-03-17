

# Sincronizar Vendas entre Card e Tabela CRM

## Problema

Quando uma venda é criada/atualizada no diálogo do lead (aba Vendas), o cache `crm-deals` usado pela Tabela CRM não é invalidado -- apenas `pipeline-deals` é. Isso significa que a coluna "Valor Vendas" e "Recorr." na tabela não atualizam até um refresh manual. O inverso também: ao fechar o dialog, a tabela não reflete as mudanças.

## Solução

Adicionar invalidação do query key `crm-deals` no `LeadEditDialog` quando uma negociação é salva. Também invalidar `crm-appointments` para manter consistência quando agendamentos mudam.

### Arquivo: `src/components/kanban/LeadEditDialog.tsx`

Na função de salvar deal (~linha 371), adicionar:

```typescript
queryClient.invalidateQueries({ queryKey: ['pipeline-deals'] });
queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
```

Isso garante que qualquer alteração feita no diálogo (vendas, agendamentos) seja refletida imediatamente na Tabela CRM quando o dialog fecha e o `onUpdate` dispara o refetch dos leads.

### Escopo

- 1 arquivo editado: `src/components/kanban/LeadEditDialog.tsx`
- Adicionar 2 linhas de invalidação de cache

