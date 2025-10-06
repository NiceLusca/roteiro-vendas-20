-- Drop and recreate the calculate_pipeline_dates function with proper type casting
CREATE OR REPLACE FUNCTION public.calculate_pipeline_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stage_prazo integer;
  current_time timestamp with time zone := now();
BEGIN
  -- Buscar prazo da etapa atual
  SELECT prazo_em_dias INTO stage_prazo
  FROM public.pipeline_stages
  WHERE id = NEW.etapa_atual_id;
  
  -- Se mudou de etapa, atualizar datas
  IF TG_OP = 'INSERT' OR OLD.etapa_atual_id IS DISTINCT FROM NEW.etapa_atual_id THEN
    -- Cast explícito para garantir tipo correto
    NEW.data_entrada_etapa := current_time::timestamp with time zone;
    NEW.data_prevista_proxima_etapa := (current_time + (COALESCE(stage_prazo, 7) || ' days')::interval)::timestamp with time zone;
  END IF;
  
  -- Calcular tempo em etapa com proteção contra NULL
  IF NEW.data_entrada_etapa IS NOT NULL THEN
    NEW.tempo_em_etapa_dias := EXTRACT(DAY FROM AGE(current_time, NEW.data_entrada_etapa::timestamp with time zone))::integer;
  ELSE
    NEW.tempo_em_etapa_dias := 0;
  END IF;
  
  -- Calcular dias em atraso
  IF NEW.data_prevista_proxima_etapa IS NOT NULL AND NEW.data_prevista_proxima_etapa < current_time THEN
    NEW.dias_em_atraso := EXTRACT(DAY FROM AGE(current_time, NEW.data_prevista_proxima_etapa))::integer;
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
$$;