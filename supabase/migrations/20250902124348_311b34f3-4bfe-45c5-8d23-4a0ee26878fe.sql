-- Seed data for initial CRM setup

-- Create default pipeline with stages
DO $$
DECLARE
    default_pipeline_id uuid;
    stage_novo_id uuid;
    stage_quali_id uuid;
    stage_apres_id uuid;
    stage_negoc_id uuid;
    stage_fecha_id uuid;
BEGIN
    -- Insert default primary pipeline
    INSERT INTO public.pipelines (id, nome, descricao, objetivo, ativo, primary_pipeline, user_id, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Geral (Primário)',
        'Pipeline padrão para gestão de leads',
        'Converter leads em clientes através de processo estruturado',
        true,
        true,
        null, -- Will be updated when users sign up
        now(),
        now()
    )
    RETURNING id INTO default_pipeline_id;

    -- Insert pipeline stages one by one
    INSERT INTO public.pipeline_stages (id, pipeline_id, nome, ordem, prazo_em_dias, proximo_passo_tipo, proximo_passo_label, entrada_criteria, saida_criteria, created_at, updated_at)
    VALUES (gen_random_uuid(), default_pipeline_id, 'Novo Lead', 1, 3, 'Humano', 'Qualificar interesse e necessidade', 'Lead cadastrado no sistema', 'Lead qualificado e interesse confirmado', now(), now())
    RETURNING id INTO stage_novo_id;

    INSERT INTO public.pipeline_stages (id, pipeline_id, nome, ordem, prazo_em_dias, proximo_passo_tipo, proximo_passo_label, entrada_criteria, saida_criteria, created_at, updated_at)
    VALUES (gen_random_uuid(), default_pipeline_id, 'Qualificação', 2, 5, 'Agendamento', 'Agendar apresentação comercial', 'Interest e budget confirmados', 'Apresentação agendada e confirmada', now(), now())
    RETURNING id INTO stage_quali_id;

    INSERT INTO public.pipeline_stages (id, pipeline_id, nome, ordem, prazo_em_dias, proximo_passo_tipo, proximo_passo_label, entrada_criteria, saida_criteria, created_at, updated_at)
    VALUES (gen_random_uuid(), default_pipeline_id, 'Apresentação', 3, 7, 'Agendamento', 'Apresentar proposta comercial', 'Necessidade mapeada e solution fit', 'Proposta apresentada e avaliada', now(), now())
    RETURNING id INTO stage_apres_id;

    INSERT INTO public.pipeline_stages (id, pipeline_id, nome, ordem, prazo_em_dias, proximo_passo_tipo, proximo_passo_label, entrada_criteria, saida_criteria, created_at, updated_at)
    VALUES (gen_random_uuid(), default_pipeline_id, 'Negociação', 4, 10, 'Humano', 'Ajustar condições e fechar negócio', 'Proposta aceita com ajustes', 'Condições finais acordadas', now(), now())
    RETURNING id INTO stage_negoc_id;

    INSERT INTO public.pipeline_stages (id, pipeline_id, nome, ordem, prazo_em_dias, proximo_passo_tipo, proximo_passo_label, entrada_criteria, saida_criteria, created_at, updated_at)
    VALUES (gen_random_uuid(), default_pipeline_id, 'Fechamento', 5, 3, 'Outro', 'Finalizar contrato e onboarding', 'Acordo final estabelecido', 'Cliente convertido e onboarded', now(), now())
    RETURNING id INTO stage_fecha_id;

    -- Insert default checklist items for each stage
    -- Novo Lead checklist
    INSERT INTO public.stage_checklist_items (stage_id, titulo, ordem, obrigatorio, created_at)
    VALUES 
        (stage_novo_id, 'Verificar dados de contato completos', 1, true, now()),
        (stage_novo_id, 'Confirmar origem do lead', 2, true, now()),
        (stage_novo_id, 'Realizar primeira qualificação básica', 3, false, now()),
        (stage_novo_id, 'Definir perfil e segmento', 4, false, now());

    -- Qualificação checklist
    INSERT INTO public.stage_checklist_items (stage_id, titulo, ordem, obrigatorio, created_at)
    VALUES 
        (stage_quali_id, 'Confirmar budget disponível', 1, true, now()),
        (stage_quali_id, 'Mapear dor/necessidade específica', 2, true, now()),
        (stage_quali_id, 'Identificar autoridade de decisão', 3, true, now()),
        (stage_quali_id, 'Avaliar timing de compra', 4, false, now()),
        (stage_quali_id, 'Qualificar fit com solução', 5, false, now());

    -- Apresentação checklist
    INSERT INTO public.stage_checklist_items (stage_id, titulo, ordem, obrigatorio, created_at)
    VALUES 
        (stage_apres_id, 'Preparar apresentação personalizada', 1, true, now()),
        (stage_apres_id, 'Confirmar participantes da reunião', 2, true, now()),
        (stage_apres_id, 'Realizar apresentação comercial', 3, true, now()),
        (stage_apres_id, 'Apresentar proposta de valor', 4, true, now()),
        (stage_apres_id, 'Coletar feedback e objeções', 5, false, now());

    -- Negociação checklist
    INSERT INTO public.stage_checklist_items (stage_id, titulo, ordem, obrigatorio, created_at)
    VALUES 
        (stage_negoc_id, 'Tratar objeções identificadas', 1, true, now()),
        (stage_negoc_id, 'Negociar condições comerciais', 2, true, now()),
        (stage_negoc_id, 'Definir forma de pagamento', 3, true, now()),
        (stage_negoc_id, 'Elaborar proposta final', 4, true, now()),
        (stage_negoc_id, 'Obter aprovação interna (cliente)', 5, false, now());

    -- Fechamento checklist
    INSERT INTO public.stage_checklist_items (stage_id, titulo, ordem, obrigatorio, created_at)
    VALUES 
        (stage_fecha_id, 'Finalizar contrato/proposta', 1, true, now()),
        (stage_fecha_id, 'Processar pagamento inicial', 2, true, now()),
        (stage_fecha_id, 'Iniciar processo de onboarding', 3, true, now()),
        (stage_fecha_id, 'Agendar kick-off do projeto', 4, false, now()),
        (stage_fecha_id, 'Transferir para pós-venda', 5, false, now());

END $$;

-- Insert default product
INSERT INTO public.products (id, nome, tipo, preco_padrao, recorrencia, ativo, user_id, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'Indefinido',
    'Outro',
    0,
    'Nenhuma',
    true,
    null, -- Will be updated when users sign up
    now(),
    now()
);

-- Create function to assign default pipeline and product to new users
CREATE OR REPLACE FUNCTION public.assign_default_data_to_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Update pipeline to belong to new user if it doesn't have an owner
    UPDATE public.pipelines 
    SET user_id = NEW.id 
    WHERE nome = 'Geral (Primário)' AND user_id IS NULL;
    
    -- Update product to belong to new user if it doesn't have an owner
    UPDATE public.products 
    SET user_id = NEW.id 
    WHERE nome = 'Indefinido' AND user_id IS NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to assign default data when user profile is created
CREATE TRIGGER assign_default_data_trigger
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_default_data_to_user();