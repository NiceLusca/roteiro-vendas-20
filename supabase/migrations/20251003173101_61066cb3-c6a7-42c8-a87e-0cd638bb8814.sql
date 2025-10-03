-- Modificar trigger para preservar valor_lead importado como score
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
  -- Se valor_lead já está preenchido, usar ele como score
  IF NEW.valor_lead IS NOT NULL AND NEW.valor_lead > 0 THEN
    NEW.lead_score := NEW.valor_lead;
    NEW.lead_score_classification := public.get_lead_score_classification(NEW.valor_lead)::lead_score_class;
  ELSE
    -- Calcular novo score normalmente
    new_score := public.calculate_lead_score(
      NEW.ja_vendeu_no_digital,
      NEW.seguidores,
      NEW.faturamento_medio,
      NEW.meta_faturamento,
      NEW.origem::text,
      NEW.objecao_principal::text
    );
    
    new_classification := public.get_lead_score_classification(new_score);
    
    NEW.lead_score := new_score;
    NEW.lead_score_classification := new_classification::lead_score_class;
    NEW.valor_lead := new_score; -- Sincronizar valor_lead com score calculado
  END IF;
  
  RETURN NEW;
END;
$function$;