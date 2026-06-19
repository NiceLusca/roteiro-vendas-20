## Webhook Kiwify → Pipeline Crescimento Acelerado Diário

Criar uma nova Edge Function `kiwify-webhook` que recebe notificações de compra da Kiwify e, quando o produto for "Crescimento Acelerado" (ID `6d3aec60-3885-11f1-afdf-b95efc23004a`), cria/atualiza o lead e o inscreve automaticamente no pipeline **Crescimento Acelerado Diário**.

### Comportamento

1. Recebe POST da Kiwify (sem validação de secret, conforme solicitado).
2. Aceita apenas eventos de pagamento aprovado (`order_approved` / `compra_aprovada` / status `paid`/`approved`).
3. Confere se o `product_id` corresponde a `6d3aec60-3885-11f1-afdf-b95efc23004a`. Caso contrário, ignora.
4. Extrai dados do comprador (nome, email, telefone) do payload Kiwify.
5. Busca lead existente por telefone → depois por email. Se achar, atualiza; se não, cria novo lead com `origem = "Kiwify - Crescimento Acelerado"`.
6. Adiciona nota `[COMPRA]` em `observacoes` com data, produto, valor e código da transação.
7. Inscreve o lead na primeira etapa ativa do pipeline `crescimento-acelerado-diario`, com `status_inscricao = 'Ativo'`.
8. Se já estiver inscrito ativo, não duplica — apenas notifica.
9. Registra atividade em `lead_activity_log` (`source: 'kiwify_webhook'`).
10. Notifica todos os admins no sino de notificações: nova compra, já inscrito ou erro.

### Detalhes técnicos

- Arquivo: `supabase/functions/kiwify-webhook/index.ts` (segue o mesmo padrão do `eduzz-webhook`).
- `verify_jwt = false` em `supabase/config.toml` (endpoint público para a Kiwify chamar).
- CORS liberado para `OPTIONS`.
- Mapeamento configurável no topo do arquivo:
  ```ts
  const KIWIFY_PRODUCT_PIPELINE_MAP: Record<string, string> = {
    '6d3aec60-3885-11f1-afdf-b95efc23004a': 'crescimento-acelerado-diario',
  };
  ```
- Parser tolerante: aceita `product_id` em `data.Product.product_id`, `data.product_id`, `order.product_id` ou `Product.id` (Kiwify varia o formato dependendo da versão do webhook).
- Após deploy, a URL para colar no painel da Kiwify será:
  `https://szuqdfakikbotidnxxvw.supabase.co/functions/v1/kiwify-webhook`

### Fora de escopo

- Nenhuma alteração de schema do banco.
- Nenhuma mudança em UI/frontend.
- Sem criação de Deal/Order automático (mesmo comportamento atual do webhook Eduzz).
