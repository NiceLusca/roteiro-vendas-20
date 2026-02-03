
# Plano: Criar Pipeline Pós-Venda

## Objetivo

Criar um novo pipeline chamado **Pós-Venda** com 7 etapas para gerenciar o relacionamento com clientes após a venda.

## Etapas do Pipeline

| Ordem | Nome da Etapa | Descrição |
|-------|---------------|-----------|
| 1 | Enviar mensagem de texto | Primeiro contato pós-venda via texto |
| 2 | Enviar áudio | Follow-up com mensagem de áudio |
| 3 | Oferecer chamada de vídeo | Suporte personalizado via videochamada |
| 4 | Oferecer pagamento recorrente | Proposta de renovação/assinatura |
| 5 | Não tem interesse | Cliente sem interesse em renovar |
| 6 | Renovou | Cliente que renovou o serviço |
| 7 | Não renovou - Passar para Comercial | Transferir para pipeline Comercial |

## Ações a Executar

### 1. Inserir Pipeline

```sql
INSERT INTO pipelines (nome, descricao, ativo, objetivo, slug)
VALUES (
  'Pós-Venda',
  'Pipeline para gerenciar relacionamento e renovação de clientes',
  true,
  'Garantir satisfação do cliente e promover renovações',
  'pos-venda'
);
```

### 2. Inserir Etapas

Serão criadas 7 etapas com:
- **ordem**: 1 a 7
- **proximo_passo_tipo**: Definido conforme a natureza de cada etapa
- **proximo_passo_label**: Ação clara para o usuário

## Configuração das Etapas

| Etapa | Próximo Passo Tipo | Label |
|-------|-------------------|-------|
| 1 - Enviar mensagem de texto | Mensagem | Enviar texto |
| 2 - Enviar áudio | Mensagem | Enviar áudio |
| 3 - Oferecer chamada de vídeo | Agendamento | Agendar videochamada |
| 4 - Oferecer pagamento recorrente | Humano | Apresentar proposta |
| 5 - Não tem interesse | Humano | Registrar feedback |
| 6 - Renovou | Outro | Finalizado |
| 7 - Não renovou | Outro | Transferir para Comercial |

## Resultado Esperado

Após a execução:
1. Novo pipeline "Pós-Venda" disponível na lista de pipelines
2. 7 etapas ordenadas do início ao fim do fluxo pós-venda
3. Pipeline acessível via slug `/pipelines/pos-venda`

## Detalhes Técnicos

- O `slug` será gerado automaticamente pelo trigger `set_pipeline_slug` se não fornecido, mas vou incluir explicitamente para garantir consistência
- As etapas 5, 6 e 7 representam estados finais do fluxo (interesse/renovação/não renovação)
- A etapa 7 indica transferência para o pipeline Comercial, que pode ser feita manualmente pelo usuário
