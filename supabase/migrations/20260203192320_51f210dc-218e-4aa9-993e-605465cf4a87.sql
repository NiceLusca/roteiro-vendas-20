-- 1. Criar o pipeline Pós-Venda
INSERT INTO pipelines (nome, descricao, ativo, objetivo, slug)
VALUES (
  'Pós-Venda',
  'Pipeline para gerenciar relacionamento e renovação de clientes',
  true,
  'Garantir satisfação do cliente e promover renovações',
  'pos-venda'
);

-- 2. Inserir as 7 etapas (usando o ID do pipeline recém-criado)
INSERT INTO pipeline_stages (pipeline_id, nome, ordem, prazo_em_dias, proximo_passo_tipo, proximo_passo_label, gerar_agendamento_auto)
SELECT 
  p.id,
  stages.nome,
  stages.ordem,
  stages.prazo_em_dias,
  stages.proximo_passo_tipo,
  stages.proximo_passo_label,
  stages.gerar_agendamento_auto
FROM pipelines p
CROSS JOIN (
  VALUES 
    (1, 'Enviar mensagem de texto', 3, 'Mensagem', 'Enviar texto', false),
    (2, 'Enviar áudio', 3, 'Mensagem', 'Enviar áudio', false),
    (3, 'Oferecer chamada de vídeo', 5, 'Agendamento', 'Agendar videochamada', true),
    (4, 'Oferecer pagamento recorrente', 7, 'Humano', 'Apresentar proposta', false),
    (5, 'Não tem interesse', 3, 'Humano', 'Registrar feedback', false),
    (6, 'Renovou', 1, 'Outro', 'Finalizado', false),
    (7, 'Não renovou - Passar para Comercial', 1, 'Outro', 'Transferir para Comercial', false)
) AS stages(ordem, nome, prazo_em_dias, proximo_passo_tipo, proximo_passo_label, gerar_agendamento_auto)
WHERE p.slug = 'pos-venda';