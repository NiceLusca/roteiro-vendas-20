

## Problema

A busca no pipeline usa `.ilike('leads.nome', ...)` — só pesquisa pelo campo `nome`. Se o usuário digitar um telefone, e-mail ou CPF, não encontra nada.

## Solução

Modificar a busca server-side para pesquisar em múltiplos campos simultaneamente usando `.or()` do Supabase, cobrindo: `nome`, `email`, `whatsapp` e `observacoes` (onde CPF costuma estar armazenado).

## Mudanças

### 1. `src/hooks/useSupabaseLeadPipelineEntries.ts` — função `searchLeads`

Substituir a linha:
```typescript
.ilike('leads.nome', `%${searchTerm}%`)
```

Por uma query que use `.or()` no join dos leads para buscar em múltiplos campos:
```typescript
.or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,whatsapp.ilike.%${searchTerm}%,observacoes.ilike.%${searchTerm}%`, { referencedTable: 'leads' })
```

Isso permite que o usuário pesquise por nome, telefone, e-mail ou qualquer dado nas observações (como CPF).

### 2. `src/pages/Pipelines.tsx` — placeholder do input

Atualizar o placeholder de `"Buscar por nome..."` para `"Buscar por nome, telefone, e-mail..."` para indicar ao usuário que a busca é mais abrangente.

### 3. `src/hooks/useLeadSearch.ts` — mesma melhoria

Aplicar a mesma lógica de busca multi-campo neste hook também, que é usado em outros selects/autocompletes:
```typescript
.or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,whatsapp.ilike.%${searchTerm}%`)
```

Substituindo o `.ilike('nome', ...)` atual.

