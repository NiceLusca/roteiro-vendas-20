-- Corrigir funções sem search_path definido
-- Atualizar todas as funções SECURITY DEFINER para ter search_path explícito

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_lead_score()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_score integer;
  new_classification text;
BEGIN
  -- Calcular novo score
  new_score := public.calculate_lead_score(
    NEW.ja_vendeu_no_digital,
    NEW.seguidores,
    NEW.faturamento_medio,
    NEW.meta_faturamento,
    NEW.origem::text,
    NEW.objecao_principal::text
  );
  
  -- Determinar classificação
  new_classification := public.get_lead_score_classification(new_score);
  
  -- Atualizar valores
  NEW.lead_score := new_score;
  NEW.lead_score_classification := new_classification::lead_score_class;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_lead_score_classification(score integer)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF score >= 60 THEN
    RETURN 'Alto';
  ELSIF score >= 30 THEN
    RETURN 'Médio';
  ELSE
    RETURN 'Baixo';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_pipeline_dates()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  stage_prazo integer;
  current_time timestamp with time zone := now();
BEGIN
  -- Buscar prazo da etapa atual
  SELECT prazo_em_dias INTO stage_prazo
  FROM public.pipeline_stages
  WHERE id = NEW.etapa_atual_id;
  
  -- Se mudou de etapa, atualizar datas
  IF TG_OP = 'INSERT' OR OLD.etapa_atual_id != NEW.etapa_atual_id THEN
    NEW.data_entrada_etapa := current_time;
    NEW.data_prevista_proxima_etapa := current_time + (stage_prazo || ' days')::interval;
  END IF;
  
  -- Calcular métricas de tempo
  NEW.tempo_em_etapa_dias := EXTRACT(DAY FROM current_time - NEW.data_entrada_etapa);
  
  -- Calcular dias em atraso
  IF NEW.data_prevista_proxima_etapa < current_time THEN
    NEW.dias_em_atraso := EXTRACT(DAY FROM current_time - NEW.data_prevista_proxima_etapa);
  ELSE
    NEW.dias_em_atraso := 0;
  END IF;
  
  -- Calcular saúde da etapa
  IF NEW.dias_em_atraso = 0 THEN
    NEW.saude_etapa := 'Verde';
  ELSIF NEW.dias_em_atraso <= 3 THEN
    NEW.saude_etapa := 'Amarelo';
  ELSE
    NEW.saude_etapa := 'Vermelho';
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_lead_status_from_deals()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Se deal foi marcada como Ganha, sugerir atualizar lead para Cliente
  IF NEW.status = 'Ganha' AND (OLD.status IS NULL OR OLD.status != 'Ganha') THEN
    UPDATE public.leads 
    SET status_geral = 'Cliente'
    WHERE id = NEW.lead_id AND status_geral != 'Cliente';
  END IF;
  
  -- Se deal foi marcada como Perdida e não há outras deals ganhas, considerar Perdido
  IF NEW.status = 'Perdida' AND (OLD.status IS NULL OR OLD.status != 'Perdida') THEN
    -- Verificar se não há outras deals ganhas para este lead
    IF NOT EXISTS (
      SELECT 1 FROM public.deals 
      WHERE lead_id = NEW.lead_id AND status = 'Ganha' AND id != NEW.id
    ) THEN
      UPDATE public.leads 
      SET status_geral = 'Perdido'
      WHERE id = NEW.lead_id AND status_geral = 'Ativo';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_order_from_deal()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_order_id uuid;
  product_price numeric;
BEGIN
  -- Só executa se deal mudou para Ganha
  IF NEW.status = 'Ganha' AND (OLD.status IS NULL OR OLD.status != 'Ganha') THEN
    
    -- Buscar preço do produto
    SELECT preco_padrao INTO product_price
    FROM public.products
    WHERE id = NEW.product_id;
    
    -- Criar order
    INSERT INTO public.orders (
      lead_id,
      closer,
      total,
      status,
      data_venda,
      observacao
    ) VALUES (
      NEW.lead_id,
      NEW.closer,
      COALESCE(NEW.valor_proposto, product_price, 0),
      'Pendente',
      now(),
      'Order criada automaticamente a partir da deal #' || NEW.id
    ) RETURNING id INTO new_order_id;
    
    -- Criar order item
    INSERT INTO public.order_items (
      order_id,
      product_id,
      valor,
      quantidade
    ) VALUES (
      new_order_id,
      NEW.product_id,
      COALESCE(NEW.valor_proposto, product_price, 0),
      1
    );
    
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_lead_score(ja_vendeu_digital boolean, seguidores integer, faturamento_medio numeric, meta_faturamento numeric, origem text, objecao_principal text)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  score integer := 0;
BEGIN
  -- +30 se já vendeu no digital
  IF ja_vendeu_digital = true THEN
    score := score + 30;
  END IF;
  
  -- +1 por 1.000 seguidores (máx. +20)
  IF seguidores IS NOT NULL AND seguidores > 0 THEN
    score := score + LEAST(20, seguidores / 1000);
  END IF;
  
  -- +20 se faturamento >= 50% da meta
  IF faturamento_medio IS NOT NULL AND meta_faturamento IS NOT NULL 
     AND meta_faturamento > 0 AND faturamento_medio >= (meta_faturamento * 0.5) THEN
    score := score + 20;
  END IF;
  
  -- +20 se origem é Indicação ou Orgânico
  IF origem IN ('Indicação', 'Orgânico') THEN
    score := score + 20;
  END IF;
  
  -- -15 se objeção principal é Preço
  IF objecao_principal = 'Preço' THEN
    score := score - 15;
  END IF;
  
  RETURN GREATEST(0, score); -- Não permitir score negativo
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_mandatory_checklist(stage_id_param uuid, checklist_state_param jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  mandatory_item RECORD;
  item_completed boolean;
BEGIN
  -- Verificar todos os itens obrigatórios da etapa
  FOR mandatory_item IN 
    SELECT id, titulo 
    FROM public.stage_checklist_items 
    WHERE stage_id = stage_id_param AND obrigatorio = true
  LOOP
    -- Verificar se o item está marcado como concluído
    item_completed := COALESCE(
      (checklist_state_param ->> mandatory_item.id::text)::boolean, 
      false
    );
    
    -- Se algum item obrigatório não estiver concluído, retorna false
    IF NOT item_completed THEN
      RETURN false;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.assign_default_data_to_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;