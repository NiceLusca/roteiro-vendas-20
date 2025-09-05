-- Criar pipeline padrão "Geral (Primário)"
INSERT INTO public.pipelines (nome, descricao, ativo, primary_pipeline, objetivo) 
VALUES (
  'Geral (Primário)',
  'Pipeline principal para novos leads - processo completo de captação até fechamento',
  true,
  true,
  'Conversão de leads em clientes'
) ON CONFLICT DO NOTHING;

-- Obter o ID do pipeline criado para usar nas etapas
DO $$
DECLARE
  main_pipeline_id uuid;
  stage_1_id uuid;
  stage_2_id uuid;
  stage_3_id uuid;
  stage_4_id uuid;
  stage_5_id uuid;
BEGIN
  -- Buscar o ID do pipeline
  SELECT id INTO main_pipeline_id FROM public.pipelines WHERE nome = 'Geral (Primário)' LIMIT 1;
  
  -- Criar as 5 etapas padrão
  INSERT INTO public.pipeline_stages (
    pipeline_id, nome, ordem, prazo_em_dias, 
    proximo_passo_label, proximo_passo_tipo, 
    gerar_agendamento_auto, duracao_minutos,
    entrada_criteria, saida_criteria
  ) VALUES 
  (main_pipeline_id, 'Contato Inicial', 1, 3, 'Realizar primeiro contato', 'Humano', false, null, 
   'Lead qualificado e com interesse demonstrado', 'Contato realizado e necessidades identificadas'),
  (main_pipeline_id, 'Qualificação', 2, 5, 'Agendar sessão de diagnóstico', 'Agendamento', true, 60,
   'Primeiro contato realizado com sucesso', 'Lead qualificado e sessão agendada'),
  (main_pipeline_id, 'Apresentação', 3, 7, 'Apresentar proposta personalizada', 'Humano', false, null,
   'Sessão de diagnóstico realizada', 'Proposta apresentada e objeções tratadas'),
  (main_pipeline_id, 'Negociação', 4, 5, 'Follow-up para decisão final', 'Humano', false, null,
   'Proposta apresentada e interesse confirmado', 'Decisão de compra ou recusa definida'),
  (main_pipeline_id, 'Fechamento', 5, 3, 'Finalizar processo', 'Humano', false, null,
   'Negociação concluída', 'Cliente fechado ou lead arquivado')
  ON CONFLICT DO NOTHING;

  -- Obter os IDs das etapas criadas
  SELECT id INTO stage_1_id FROM public.pipeline_stages WHERE pipeline_stages.pipeline_id = main_pipeline_id AND ordem = 1;
  SELECT id INTO stage_2_id FROM public.pipeline_stages WHERE pipeline_stages.pipeline_id = main_pipeline_id AND ordem = 2;
  SELECT id INTO stage_3_id FROM public.pipeline_stages WHERE pipeline_stages.pipeline_id = main_pipeline_id AND ordem = 3;
  SELECT id INTO stage_4_id FROM public.pipeline_stages WHERE pipeline_stages.pipeline_id = main_pipeline_id AND ordem = 4;
  SELECT id INTO stage_5_id FROM public.pipeline_stages WHERE pipeline_stages.pipeline_id = main_pipeline_id AND ordem = 5;

  -- Criar checklists padrão para cada etapa
  -- Etapa 1: Contato Inicial
  INSERT INTO public.stage_checklist_items (stage_id, titulo, ordem, obrigatorio) VALUES
  (stage_1_id, 'Registrar primeiro contato no WhatsApp', 1, true),
  (stage_1_id, 'Identificar origem do lead', 2, true),
  (stage_1_id, 'Confirmar dados de contato (nome, telefone)', 3, true),
  (stage_1_id, 'Registrar segmento de atuação', 4, false),
  (stage_1_id, 'Avaliar nível de interesse inicial', 5, true);

  -- Etapa 2: Qualificação  
  INSERT INTO public.stage_checklist_items (stage_id, titulo, ordem, obrigatorio) VALUES
  (stage_2_id, 'Realizar sessão de diagnóstico', 1, true),
  (stage_2_id, 'Preencher questionário de qualificação', 2, true),
  (stage_2_id, 'Identificar dor principal do lead', 3, true),
  (stage_2_id, 'Confirmar fit produto-mercado', 4, true),
  (stage_2_id, 'Registrar faturamento atual e meta', 5, false);

  -- Etapa 3: Apresentação
  INSERT INTO public.stage_checklist_items (stage_id, titulo, ordem, obrigatorio) VALUES
  (stage_3_id, 'Apresentar solução personalizada', 1, true),
  (stage_3_id, 'Demonstrar casos de sucesso relevantes', 2, true),
  (stage_3_id, 'Registrar objeções apresentadas', 3, true),
  (stage_3_id, 'Tratar principais objeções', 4, true),
  (stage_3_id, 'Confirmar interesse na solução', 5, true);

  -- Etapa 4: Negociação
  INSERT INTO public.stage_checklist_items (stage_id, titulo, ordem, obrigatorio) VALUES
  (stage_4_id, 'Apresentar proposta comercial', 1, true),
  (stage_4_id, 'Negociar condições de pagamento', 2, false),
  (stage_4_id, 'Definir prazo para decisão', 3, true),
  (stage_4_id, 'Registrar feedback sobre proposta', 4, true),
  (stage_4_id, 'Agendar follow-up de decisão', 5, true);

  -- Etapa 5: Fechamento
  INSERT INTO public.stage_checklist_items (stage_id, titulo, ordem, obrigatorio) VALUES
  (stage_5_id, 'Confirmar decisão final do lead', 1, true),
  (stage_5_id, 'Processar pagamento (se fechou)', 2, false),
  (stage_5_id, 'Registrar motivo da recusa (se perdeu)', 3, false),
  (stage_5_id, 'Enviar materiais de onboarding (se cliente)', 4, false),
  (stage_5_id, 'Atualizar status geral do lead', 5, true);

END $$;

-- Criar produto padrão "Indefinido"
INSERT INTO public.products (nome, tipo, preco_padrao, recorrencia, ativo)
VALUES (
  'Indefinido',
  'Outro',
  0,
  'Nenhuma',
  true
) ON CONFLICT DO NOTHING;