-- Corrigir search_path das funções para segurança

-- 1. Corrigir função calculate_lead_score
CREATE OR REPLACE FUNCTION public.calculate_lead_score(
  ja_vendeu_digital boolean,
  seguidores integer,
  faturamento_medio numeric,
  meta_faturamento numeric,
  origem text,
  objecao_principal text
) RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 2. Corrigir função get_lead_score_classification
CREATE OR REPLACE FUNCTION public.get_lead_score_classification(score integer)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF score >= 60 THEN
    RETURN 'Alto';
  ELSIF score >= 30 THEN
    RETURN 'Médio';
  ELSE
    RETURN 'Baixo';
  END IF;
END;
$$;

-- 3. Corrigir função validate_mandatory_checklist
CREATE OR REPLACE FUNCTION public.validate_mandatory_checklist(
  stage_id_param uuid,
  checklist_state_param jsonb
) RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;