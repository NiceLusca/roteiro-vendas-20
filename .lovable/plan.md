

## Problema

O webhook da Eduzz processa compras e inscreve leads no pipeline, mas tudo acontece silenciosamente. Os admins não recebem nenhuma notificação no CRM quando uma nova compra é processada, um lead é criado, ou quando ocorre um erro.

## Solução

Adicionar notificações in-app para todos os admins sempre que o webhook processar uma compra com sucesso ou falhar. Isso usa a tabela `notifications` que já existe no sistema.

## Mudanças

### 1. Edge Function `eduzz-webhook/index.ts`

Após processar com sucesso (lead criado/atualizado + inscrito no pipeline), inserir uma notificação na tabela `notifications` para cada admin:

- Buscar todos os `user_id` da tabela `user_roles` onde `role = 'admin'`
- Inserir uma notificação para cada admin com:
  - **type**: `'automation'`
  - **priority**: `'medium'`
  - **title**: `'Nova Compra Eduzz'`
  - **message**: `"[Nome do cliente] comprou [Produto] - R$ [valor]. Lead inscrito no pipeline [nome pipeline]."`
  - **lead_id**: ID do lead
  - **lead_name**: nome do cliente
  - **action_url**: `/pipelines?lead=[leadId]`

- Também notificar em caso de **erro** no processamento:
  - **type**: `'automation'`
  - **priority**: `'critical'`
  - **title**: `'Erro no Webhook Eduzz'`
  - **message**: descrição do erro

- Notificar quando lead **já está inscrito** no pipeline (para visibilidade):
  - **priority**: `'low'`
  - **title**: `'Compra Eduzz - Lead já inscrito'`

### 2. Cenários cobertos

```text
Compra processada com sucesso  → Notificação "medium" para admins
Lead já inscrito no pipeline   → Notificação "low" para admins  
Erro no processamento          → Notificação "critical" para admins
Produto não mapeado            → Sem notificação (não é relevante)
Evento não é compra (ping)     → Sem notificação
```

### Detalhes técnicos

- A edge function já usa `SUPABASE_SERVICE_ROLE_KEY`, então o insert na tabela `notifications` funciona sem problemas de RLS
- Nenhuma mudança de banco necessária — a tabela `notifications` já tem todos os campos necessários
- O `NotificationCenter` existente no frontend já exibe essas notificações em tempo real
- São 7 admins no sistema atualmente, então serão 7 inserts por compra (batch insert)

