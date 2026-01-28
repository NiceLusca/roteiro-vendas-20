
# Plano: Criar Order Automática e Preencher Closer ao Confirmar Venda

## Problema Identificado

Ao marcar "Venda Confirmada" no LeadEditDialog:
1. **Só o deal é salvo** - nenhum registro é criado na tabela `orders`
2. **Closer não é preenchido** - nem no deal nem no order
3. **comercial-metrics busca de orders** - por isso não aparece no Clarity

### Dados da venda da Jeane:
- Deal: R$ 1.497, status "ganho" ✓
- Order: NÃO EXISTE ✗
- Closer: NULL ✗
- Responsável principal: Lucas Nascimento ✓

---

## Solução

### 1. Modificar handleSaveDeal para criar order automaticamente

Quando `vendaConfirmada = true`:
1. Salvar o deal (como já faz)
2. **Buscar o responsável principal** do lead
3. **Criar/atualizar order** com:
   - `lead_id`: do lead
   - `deal_id`: do deal salvo
   - `valor_total`: igual ao deal
   - `closer`: nome do responsável principal
   - `status_pagamento`: 'pago'
   - `data_venda`: timestamp atual

### 2. Usar responsável principal como closer

O closer no contexto comercial é quem fechou a venda - que deve ser o **responsável principal** atribuído ao lead, não um campo texto livre.

---

## Arquivos a Modificar

| # | Arquivo | Alteracao |
|---|---------|-----------|
| 1 | `src/components/kanban/LeadEditDialog.tsx` | Modificar `handleSaveDeal` para criar order e buscar closer |

---

## Detalhes Tecnicos

### Logica do handleSaveDeal atualizado:

```typescript
const handleSaveDeal = async () => {
  const parsedValor = parseFloat(dealValor.replace(/\D/g, '')) / 100 || 0;
  
  if (parsedValor <= 0) {
    toast.error('Informe o valor da venda');
    return;
  }

  try {
    setSavingDeal(true);
    const status = vendaConfirmada ? 'ganho' : 'aberto';

    // 1. Salvar o deal
    const result = await saveDeal({
      ...(existingDeal?.id ? { id: existingDeal.id } : {}),
      lead_id: lead.id,
      valor_proposto: parsedValor,
      recorrente: vendaRecorrente,
      status: status as any,
      data_fechamento: vendaConfirmada ? new Date().toISOString() : null
    });

    // 2. Salvar produtos associados
    if (result?.id && selectedProductIds.length > 0) {
      await setDealProducts(selectedProductIds);
    }

    // 3. SE VENDA CONFIRMADA: criar/atualizar order
    if (vendaConfirmada && result?.id) {
      // Buscar responsavel principal para usar como closer
      const { data: primaryResp } = await supabase
        .from('lead_responsibles')
        .select('profiles(nome, full_name)')
        .eq('lead_id', lead.id)
        .eq('is_primary', true)
        .single();
      
      const closerName = primaryResp?.profiles?.nome 
        || primaryResp?.profiles?.full_name 
        || 'Não atribuído';
      
      // Verificar se ja existe order para este deal
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('deal_id', result.id)
        .single();
      
      if (existingOrder?.id) {
        // Atualizar order existente
        await supabase
          .from('orders')
          .update({
            valor_total: parsedValor,
            closer: closerName,
            status_pagamento: 'pago',
            data_venda: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingOrder.id);
      } else {
        // Criar nova order
        await supabase
          .from('orders')
          .insert({
            lead_id: lead.id,
            deal_id: result.id,
            valor_total: parsedValor,
            closer: closerName,
            status_pagamento: 'pago',
            data_venda: new Date().toISOString()
          });
      }
    }

    toast.success(existingDeal ? 'Negociação atualizada!' : 'Negociação criada!');
    onUpdate?.();
  } catch (error) {
    console.error('Erro ao salvar deal:', error);
    toast.error('Erro ao salvar negociação');
  } finally {
    setSavingDeal(false);
  }
};
```

---

## Migracao de Dados

Para a venda da Jeane (e outras ja confirmadas), criar order retroativamente:

```sql
INSERT INTO orders (lead_id, deal_id, valor_total, closer, status_pagamento, data_venda)
SELECT 
  d.lead_id,
  d.id as deal_id,
  d.valor_proposto as valor_total,
  COALESCE(p.nome, p.full_name, 'Não atribuído') as closer,
  'pago' as status_pagamento,
  d.data_fechamento as data_venda
FROM deals d
LEFT JOIN lead_responsibles lr ON lr.lead_id = d.lead_id AND lr.is_primary = true
LEFT JOIN profiles p ON lr.user_id = p.user_id
WHERE d.status = 'ganho'
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.deal_id = d.id);
```

---

## Resultado Esperado

1. **Venda confirmada** cria deal + order automaticamente
2. **Closer = responsavel principal** do lead
3. **comercial-metrics** mostra receita e conversao por closer corretamente
4. **Clarity** recebe os dados de vendas com atribuicao correta

---

## Fluxo Visual

```text
Usuario marca "Venda Confirmada" (R$ 1.497)
        |
        v
+------------------+
|   Salva DEAL     |
|   status: ganho  |
+------------------+
        |
        v
+------------------+
| Busca responsavel|
| principal        |
| -> "Lucas"       |
+------------------+
        |
        v
+------------------+
|   Cria ORDER     |
|   closer: Lucas  |
|   valor: 1497    |
|   status: pago   |
+------------------+
        |
        v
comercial-metrics API
        |
        v
Clarity Dashboard: Lucas - R$ 1.497
```
