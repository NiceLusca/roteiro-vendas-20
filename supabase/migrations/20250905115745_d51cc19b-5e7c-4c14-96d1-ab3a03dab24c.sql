-- Criar pipeline padrão "Geral (Primário)" se não existir
INSERT INTO public.pipelines (nome, descricao, ativo, primary_pipeline, objetivo) 
SELECT 
  'Geral (Primário)',
  'Pipeline principal para novos leads - processo completo de captação até fechamento',
  true,
  true,
  'Conversão de leads em clientes'
WHERE NOT EXISTS (
  SELECT 1 FROM public.pipelines WHERE nome = 'Geral (Primário)'
);

-- Criar produto padrão "Indefinido" se não existir
INSERT INTO public.products (nome, tipo, preco_padrao, recorrencia, ativo)
SELECT 
  'Indefinido',
  'Outro',
  0,
  'Nenhuma',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.products WHERE nome = 'Indefinido'
);

-- Criar etapas e checklists se o pipeline existir mas não tiver etapas
DO $$
DECLARE
  main_pipeline_id uuid;
  stage_count integer;
BEGIN
  -- Buscar o ID do pipeline
  SELECT id INTO main_pipeline_id FROM public.pipelines WHERE nome = 'Geral (Primário)' LIMIT 1;
  
  -- Verificar se já existem etapas para este pipeline
  SELECT COUNT(*) INTO stage_count FROM public.pipeline_stages WHERE pipeline_id = main_pipeline_id;
  
  -- Só criar as etapas se não existirem
  IF stage_count = 0 AND main_pipeline_id IS NOT NULL THEN
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
     'Negociação concluída', 'Cliente fechado ou lead arquivado');

    -- Criar checklists para as etapas criadas
    -- Usando INSERT com subqueries para evitar conflitos
    INSERT INTO public.stage_checklist_items (stage_id, titulo, ordem, obrigatorio)
    SELECT ps.id, 'Registrar primeiro contato no WhatsApp', 1, true
    FROM public.pipeline_stages ps 
    WHERE ps.pipeline_id = main_pipeline_id AND ps.ordem = 1
    AND NOT EXISTS (SELECT 1 FROM public.stage_checklist_items sci WHERE sci.stage_id = ps.id AND sci.ordem = 1);

    INSERT INTO public.stage_checklist_items (stage_id, titulo, ordem, obrigatorio)
    SELECT ps.id, 'Identificar origem do lead', 2, true
    FROM public.pipeline_stages ps 
    WHERE ps.pipeline_id = main_pipeline_id AND ps.ordem = 1
    AND NOT EXISTS (SELECT 1 FROM public.stage_checklist_items sci WHERE sci.stage_id = ps.id AND sci.ordem = 2);

    -- Continuar com o restante dos checklists...
    -- Etapa 1: Contato Inicial (resto)
    INSERT INTO public.stage_checklist_items (stage_id, titulo, ordem, obrigatorio)
    SELECT ps.id, 'Confirmar dados de contato (nome, telefone)', 3, true
    FROM public.pipeline_stages ps 
    WHERE ps.pipeline_id = main_pipeline_id AND ps.ordem = 1
    AND NOT EXISTS (SELECT 1 FROM public.stage_checklist_items sci WHERE sci.stage_id = ps.id AND sci.ordem = 3);

    INSERT INTO public.stage_checklist_items (stage_id, titulo, ordem, obrigatorio)
    SELECT ps.id, 'Registrar segmento de atuação', 4, false
    FROM public.pipeline_stages ps 
    WHERE ps.pipeline_id = main_pipeline_id AND ps.ordem = 1
    AND NOT EXISTS (SELECT 1 FROM public.stage_checklist_items sci WHERE sci.stage_id = ps.id AND sci.ordem = 4);

    INSERT INTO public.stage_checklist_items (stage_id, titulo, ordem, obrigatorio)
    SELECT ps.id, 'Avaliar nível de interesse inicial', 5, true
    FROM public.pipeline_stages ps 
    WHERE ps.pipeline_id = main_pipeline_id AND ps.ordem = 1
    AND NOT EXISTS (SELECT 1 FROM public.stage_checklist_items sci WHERE sci.stage_id = ps.id AND sci.ordem = 5);
  END IF;
END $$;