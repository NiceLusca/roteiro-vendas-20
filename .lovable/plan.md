

# Atribuição de Closer por Negociação (sem duplicar leads)

## Problema

Hoje o campo `closer` vive na tabela `leads` (1 closer por lead). Quando um lead é atendido por closers diferentes em momentos distintos, não há como rastrear quem fez qual venda. Duplicar o lead seria péssima prática -- cria dados inconsistentes e dificulta histórico.

## Solução: Closer no Deal, não no Lead

A entidade correta para rastrear o closer é o **Deal** (negociação), não o Lead. Cada atendimento/tentativa de venda já deveria gerar um Deal. O closer fica vinculado a cada deal individualmente.

### Mudanças no banco

1. **Adicionar coluna `closer_id`** na tabela `deals` (uuid, FK para profiles.user_id)
2. Manter compatibilidade com `leads.closer` (campo legado, leitura apenas)

```text
Lead (pessoa única)
 ├── Deal 1 → closer: Ana  → status: ganho  → R$ 5.000
 ├── Deal 2 → closer: João → status: perdido
 └── Deal 3 → closer: João → status: ganho  → R$ 3.000
```

### Mudanças na Tabela CRM

Na coluna "Valor Vendas", ao invés de mostrar apenas o total, mostrar um **tooltip ou sub-linha expansível** com o breakdown por closer:

| Lead | Closer Atual | Valor Vendas | Detalhes |
|------|-------------|-------------|----------|
| Maria | João | R$ 8.000 | Ana: R$ 5.000 · João: R$ 3.000 |

### Mudanças no código

1. **Migration SQL**: Adicionar `closer_id uuid` na tabela `deals`
2. **`useLeadsCRMData.ts`**: Buscar deals com closer_id e join com profiles para nome
3. **`LeadsCRMTable.tsx`**: Mostrar breakdown de vendas por closer (tooltip no hover da célula de valor)
4. **`DealForm.tsx`**: Adicionar seletor de closer ao criar/editar deal (usando lista de profiles, similar ao ResponsibleSelector)
5. **`LeadEditDialog.tsx`**: Garantir que ao criar deal, o closer logado seja pré-selecionado

### Escopo

- 1 migration (adicionar `closer_id` em deals)
- 4-5 arquivos editados
- Não quebra nenhuma funcionalidade existente (campo é opcional, legado continua funcionando)

