

# Diagnóstico: filtro Closer no CRM já tem fix no servidor, mas o frontend ignora

## O que descobri

1. **`comercial-leads-list` (servidor) já está correta.** Os logs confirmam 14 closers distintos retornados (Vagner=131, Não atribuído=309, Lucas Casagrande Sampaio=44, Gabriel=109, Carolaine Santana=69, Casagrande=68, Carol=69, Alessandra=67, Uilma=61, Yan Hagassy=4, etc.). Não precisa redeploy — o código v3 já está no ar.

2. **O CRM não consome `comercial-leads-list`.** Busquei por toda a `src/` e não há nenhuma chamada a essa função. Ela é exclusiva do Clarity externo.

3. **O filtro Closer da Tabela CRM lê o campo legado `leads.closer`.** Em `src/components/leads/CRMTableFilters.tsx` (linha 26):
   ```ts
   leads.forEach(l => { if (l.closer?.trim()) set.add(l.closer!.trim()); });
   ```
   Esse campo só tem 2 valores ("Não atribuído" e "Yan Hagassy") porque a maioria dos closers reais está em `deals.closer_id` (com FK para `profiles`) ou `lead_responsibles.is_primary`, e não na coluna texto `leads.closer`.

## Por que redeployar `comercial-leads-list` não resolve

Mesmo redeployando, o filtro do CRM continuaria mostrando só 2 nomes — porque ele nunca leu da edge function. O Clarity (consumidor externo) já recebe os 8+ closers desde o último deploy.

## O que de fato precisa mudar

Aplicar a mesma hierarquia `deals → lead_responsibles → leads.closer → "Não atribuído"` no carregamento do CRM, para que o filtro Closer popule a partir dessa fonte unificada e não do campo legado.

### Mudanças

**`src/hooks/useLeadsCRMData.ts`**
- Já busca `deals` com `profiles:closer_id(nome, full_name)` para o breakdown de vendas. Estender essa lógica para também construir um mapa `leadId → closer resolvido` usando a hierarquia.
- Buscar adicionalmente `lead_responsibles` com `is_primary=true` e join com `profiles`.
- Expor um campo `closerResolvido` no objeto retornado por lead (sem alterar `lead.closer` original, para não quebrar edição inline).

**`src/components/leads/CRMTableFilters.tsx`**
- Trocar `l.closer?.trim()` por `l.closerResolvido?.trim()` na linha 26 ao popular `uniqueClosers`.
- Manter o resto do componente igual.

**`src/components/leads/LeadsCRMTable.tsx`** (pequeno ajuste, se necessário)
- Quando aplicar o filtro selecionado, comparar contra `closerResolvido` em vez de `closer`.
- A célula editável "Closer" continua editando `leads.closer` (campo legado) — sem alteração de comportamento de escrita.

### Resultado esperado

O dropdown "Closer" na Tabela CRM passa a listar os 8 nomes reais (Alessandra, Casagrande, Gabriel, Carol, Vagner, Uilma, Lucas Casagrande Sampaio, Não atribuído + outros que existirem em deals/responsibles), batendo com o que `comercial-metrics` já retorna.

## Resumo técnico

| Arquivo | Mudança |
|---|---|
| `src/hooks/useLeadsCRMData.ts` | Buscar `lead_responsibles` + montar `closerResolvido` por hierarquia |
| `src/components/leads/CRMTableFilters.tsx` | Popular dropdown a partir de `closerResolvido` |
| `src/components/leads/LeadsCRMTable.tsx` | Filtrar por `closerResolvido` (preservar edição de `closer`) |

Nenhuma mudança em edge function, nenhuma mudança de schema.

